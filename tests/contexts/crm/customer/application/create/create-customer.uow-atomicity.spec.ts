import { DataSource, EntityManager } from 'typeorm'

import { TypeOrmCustomerRepository } from '@contexts/crm/customer/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerEntity } from '@contexts/crm/customer/infrastructure/persistence/typeorm/customer.entity'
import { TypeOrmLoyaltyAccountRepository } from '@contexts/crm/loyalty/infrastructure/persistence/typeorm/typeorm-loyalty-account.repository'
import { LoyaltyAccountEntity } from '@contexts/crm/loyalty/infrastructure/persistence/typeorm/loyalty-account.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { CustomerMother } from '@test/contexts/crm/customer/__mothers__/customer.mother'
import { LoyaltyAccountMother } from '@test/contexts/crm/loyalty/__mothers__/loyalty-account.mother'

/**
 * Slice 6 Group A (6.5) — proves the atomicity guarantee
 * `@UseInterceptors(TransactionInterceptor)` on `POST /customers` relies
 * on: `CreateCustomer.run()` saves the Customer, then publishes
 * `CustomerCreatedEvent`, which the router dispatches synchronously
 * (design D5/D8, category 1) to `CreateLoyaltyAccountOnCustomerCreated` ->
 * `TypeOrmLoyaltyAccountRepository.save()` (loyalty wiring fixed in
 * Slice 7).
 *
 * Same shape as Group A's 6.6 (CreateIngredient/InventoryLevel): the
 * second write is triggered BY THE ROUTER mid-`publish()`, not by the use
 * case body directly. The interceptor's ambient `EntityManager` is what
 * lets both `TransactionalRepository` instances (Customer + LoyaltyAccount)
 * resolve a scoped `Repository<T>` from the SAME manager, so both writes
 * share one real Postgres transaction.
 *
 * The companion fail-fast contract — that dispatching a category-1
 * subscriber with NO ambient context throws `MissingUnitOfWorkContext`
 * instead of silently degrading — is already proven exhaustively at the
 * router level in `tests/shared/infrastructure/event-bus/event-bus-router.spec.ts`
 * (design D5/D8) and is NOT duplicated here.
 */
describe('CreateCustomer (via cat-1 dispatch) — UoW atomicity (Slice 6 Group A, 6.5)', () => {
  const buildScopedGetRepository = (calls: unknown[]) => {
    return jest.fn((target: unknown) => {
      calls.push(target)
      if (target === CustomerEntity) {
        return {
          create: jest.fn((_entity: unknown, row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      if (target === LoyaltyAccountEntity) {
        return {
          create: jest.fn((_entity: unknown, row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      throw new Error(`Unexpected entity target passed to getRepository: ${String(target)}`)
    })
  }

  it('resolves both TypeOrmCustomerRepository.save() and TypeOrmLoyaltyAccountRepository.save() from the SAME ambient manager', async () => {
    const holder = new UnitOfWorkContextHolder()
    const resolvedTargets: unknown[] = []
    const ambientManager = {
      getRepository: buildScopedGetRepository(resolvedTargets)
    } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const defaultCustomerRepo = {
      target: CustomerEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<CustomerEntity>
    const defaultLoyaltyRepo = {
      target: LoyaltyAccountEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<LoyaltyAccountEntity>

    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepo, holder)
    const loyaltyAccountRepository = new TypeOrmLoyaltyAccountRepository(defaultLoyaltyRepo, holder)

    await holder.run(context, async () => {
      await customerRepository.save(CustomerMother.random())
      await loyaltyAccountRepository.save(LoyaltyAccountMother.random())
    })

    expect(resolvedTargets).toContain(CustomerEntity)
    expect(resolvedTargets).toContain(LoyaltyAccountEntity)
    // Each TransactionalRepository.save() accesses the `this.repo` getter
    // once here (both repos' save() call `this.repo.save()` a single time).
    expect(ambientManager.getRepository).toHaveBeenCalledTimes(2)
  })

  it('WITHOUT an ambient context, both repositories independently fall back to their own default (non-shared) manager — the pre-interceptor bug baseline', async () => {
    const holder = new UnitOfWorkContextHolder()
    const dataSource = { transaction: jest.fn() } as unknown as DataSource
    void dataSource

    const defaultCustomerManager = {
      getRepository: jest.fn()
    }
    const defaultLoyaltyManager = {
      getRepository: jest.fn()
    }
    const defaultCustomerRepo = {
      target: CustomerEntity,
      manager: defaultCustomerManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<CustomerEntity>
    const defaultLoyaltyRepo = {
      target: LoyaltyAccountEntity,
      manager: defaultLoyaltyManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<LoyaltyAccountEntity>

    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepo, holder)
    const loyaltyAccountRepository = new TypeOrmLoyaltyAccountRepository(defaultLoyaltyRepo, holder)

    await customerRepository.save(CustomerMother.random())
    await loyaltyAccountRepository.save(LoyaltyAccountMother.random())

    // Neither repo's ambient `getRepository` dispatcher was ever consulted —
    // each independently used its own injected default repository, meaning
    // (in real Postgres) each save autocommits on its own connection. This
    // reproduces today's non-atomic baseline the interceptor exists to fix.
    expect(defaultCustomerManager.getRepository).not.toHaveBeenCalled()
    expect(defaultLoyaltyManager.getRepository).not.toHaveBeenCalled()
  })
})
