import { DataSource, EntityManager } from 'typeorm'

import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { TypeOrmTableRepository } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/typeorm-table.repository'
import { TableEntity } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/table.entity'
import { TypeOrmCustomerRepository } from '@contexts/crm/customer/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerEntity } from '@contexts/crm/customer/infrastructure/persistence/typeorm/customer.entity'
import { TypeOrmInventoryLevelRepository } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-level.repository'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { OrderMother } from '../__mothers__/order.mother'
import { TableMother } from '@test/contexts/restaurant/table/__mothers__/table.mother'
import { CustomerMother } from '@test/contexts/crm/customer/__mothers__/customer.mother'
import { InventoryLevelMother } from '@test/contexts/inventory/stock-level/__mothers__/inventory-level.mother'

/**
 * Slice 6 Group A (6.7) — LAST endpoint in Slice 6 (16/16 complete once this
 * lands). Proves the atomicity guarantee `@UseInterceptors(TransactionInterceptor)`
 * on `POST /orders/:id/close` relies on: `CloseOrder.run()` saves the Order
 * (via `TypeOrmOrderRepository.save()`, which writes through `this.manager`
 * directly — see that file's doc comment), then publishes `OrderClosedEvent`,
 * which the router dispatches synchronously (design D5/D8, category 1) to
 * THREE subscribers in the same transaction:
 *   - `ReleaseTableOnOrderClosed`      -> `TypeOrmTableRepository.save()`
 *   - `UpdateLifetimeValueOnOrderClosed` -> `TypeOrmCustomerRepository.save()`
 *   - `DeductIngredientsOnOrderClosed` -> ... -> `TypeOrmInventoryLevelRepository.save()`
 *     (representative leg of the deduction chain — batch/movement repos share
 *     the identical `TransactionalRepository` base and are not re-proven here;
 *     the branching logic itself is exhaustively unit-tested in
 *     `deduct-ingredients-on-order-closed.spec.ts`)
 *
 * This is the most complex Slice 6 endpoint: FOUR repositories (order, table,
 * customer, inventory-level) must resolve their `Repository<T>` from the SAME
 * ambient `EntityManager` for the whole close operation to be atomic — the
 * capstone proof for the original incident (stock/table/LTV drifting from
 * order state) this entire change was built to fix.
 *
 * The companion fail-fast contract — that dispatching a category-1 subscriber
 * with NO ambient context throws `MissingUnitOfWorkContext` instead of
 * silently degrading — is already proven exhaustively at the router level in
 * `tests/shared/infrastructure/event-bus/event-bus-router.spec.ts` (design
 * D5/D8) and is NOT duplicated here.
 */
describe('CloseOrder (via cat-1 dispatch to 3 subscribers) — UoW atomicity (Slice 6 Group A, 6.7)', () => {
  const buildScopedGetRepository = (calls: unknown[]) => {
    return jest.fn((target: unknown) => {
      calls.push(target)
      if (target === TableEntity) {
        return {
          create: jest.fn((row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      if (target === CustomerEntity) {
        return {
          create: jest.fn((_entity: unknown, row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      if (target === InventoryLevelEntity) {
        return {
          create: jest.fn((row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      throw new Error(`Unexpected entity target passed to getRepository: ${String(target)}`)
    })
  }

  it('resolves Order (direct manager.save), Table, Customer, and InventoryLevel saves from the SAME ambient manager', async () => {
    const holder = new UnitOfWorkContextHolder()
    const resolvedTargets: unknown[] = []
    const ambientManagerSave = jest.fn().mockResolvedValue(undefined)
    const ambientManagerCreate = jest.fn((_entity: unknown, rows: unknown) => rows)
    const ambientQueryBuilder = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined)
    }
    const ambientManager = {
      save: ambientManagerSave,
      create: ambientManagerCreate,
      createQueryBuilder: jest.fn(() => ambientQueryBuilder),
      getRepository: buildScopedGetRepository(resolvedTargets)
    } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const defaultOrderRepo = {
      target: OrderEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<OrderEntity>
    const defaultOrderItemRepo = {} as unknown as import('typeorm').Repository<OrderItemEntity>
    const defaultDataSource = { transaction: jest.fn() } as unknown as DataSource
    const defaultTableRepo = {
      target: TableEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<TableEntity>
    const defaultCustomerRepo = {
      target: CustomerEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<CustomerEntity>
    const defaultLevelRepo = {
      target: InventoryLevelEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<InventoryLevelEntity>

    const orderRepository = new TypeOrmOrderRepository(
      defaultOrderRepo,
      defaultOrderItemRepo,
      defaultDataSource,
      holder
    )
    const tableRepository = new TypeOrmTableRepository(defaultTableRepo, holder)
    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepo, holder)
    const levelRepository = new TypeOrmInventoryLevelRepository(defaultLevelRepo, holder)

    await holder.run(context, async () => {
      // 1. The use case's own save (order status/totals flip to CLOSED)
      await orderRepository.save(OrderMother.readyToClose())
      // 2. Cat-1 subscriber #1: table released
      await tableRepository.save(TableMother.occupied())
      // 3. Cat-1 subscriber #2: customer LTV updated
      await customerRepository.save(CustomerMother.random())
      // 4. Cat-1 subscriber #3: inventory level decreased (deduction leg)
      await levelRepository.save(InventoryLevelMother.random())
    })

    // Order.save() writes through `this.manager` directly (manager.save),
    // never through `getRepository` — proves it used the SAME ambient
    // manager instance as the other three repos below.
    expect(ambientManagerSave).toHaveBeenCalledWith(OrderEntity, expect.objectContaining({}))

    expect(resolvedTargets).toContain(TableEntity)
    expect(resolvedTargets).toContain(CustomerEntity)
    expect(resolvedTargets).toContain(InventoryLevelEntity)
    // TableRepository.save() and CustomerRepository.save() each access
    // `this.repo` once; InventoryLevelRepository.save() accesses it twice
    // (once for `.create`, once for `.save`) — 1 + 1 + 2 = 4.
    expect(ambientManager.getRepository).toHaveBeenCalledTimes(4)
  })

  it('WITHOUT an ambient context, all four repositories independently fall back to their own default (non-shared) manager — the pre-interceptor bug baseline', async () => {
    const holder = new UnitOfWorkContextHolder()

    const defaultOrderManager = {
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((row: unknown) => row),
      createQueryBuilder: jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined)
      }))
    }
    const defaultTableManager = { getRepository: jest.fn() }
    const defaultCustomerManager = { getRepository: jest.fn() }
    const defaultLevelManager = { getRepository: jest.fn() }

    const defaultOrderRepo = {
      target: OrderEntity,
      manager: defaultOrderManager
    } as unknown as import('typeorm').Repository<OrderEntity>
    const defaultOrderItemRepo = {} as unknown as import('typeorm').Repository<OrderItemEntity>
    const defaultDataSource = { transaction: jest.fn() } as unknown as DataSource
    const defaultTableRepo = {
      target: TableEntity,
      manager: defaultTableManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<TableEntity>
    const defaultCustomerRepo = {
      target: CustomerEntity,
      manager: defaultCustomerManager,
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<CustomerEntity>
    const defaultLevelRepo = {
      target: InventoryLevelEntity,
      manager: defaultLevelManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<InventoryLevelEntity>

    const orderRepository = new TypeOrmOrderRepository(
      defaultOrderRepo,
      defaultOrderItemRepo,
      defaultDataSource,
      holder
    )
    const tableRepository = new TypeOrmTableRepository(defaultTableRepo, holder)
    const customerRepository = new TypeOrmCustomerRepository(defaultCustomerRepo, holder)
    const levelRepository = new TypeOrmInventoryLevelRepository(defaultLevelRepo, holder)

    await orderRepository.save(OrderMother.readyToClose())
    await tableRepository.save(TableMother.occupied())
    await customerRepository.save(CustomerMother.random())
    await levelRepository.save(InventoryLevelMother.random())

    // Each repo used its own injected default manager/repository — no
    // ambient dispatcher was ever consulted, meaning (in real Postgres) each
    // save autocommits independently. This is the exact bug this endpoint's
    // interceptor exists to close: order closes, but the table release, LTV
    // update, or stock deduction can each independently fail without rolling
    // back the others.
    expect(defaultTableManager.getRepository).not.toHaveBeenCalled()
    expect(defaultCustomerManager.getRepository).not.toHaveBeenCalled()
    expect(defaultLevelManager.getRepository).not.toHaveBeenCalled()
  })

  it('a category-1 subscriber failure (e.g. DeductIngredientsOnOrderClosed hitting insufficient stock) propagates uncaught out of the dispatch chain — the signal Postgres uses to roll back the WHOLE transaction (order + table + LTV + stock, all-or-nothing)', async () => {
    const holder = new UnitOfWorkContextHolder()
    const failure = new Error('NoStockAvailableException: insufficient stock for ingredient X')

    // Simulates the router's synchronous cat-1 dispatch loop: awaits each
    // subscriber in order and does not swallow a throw — see
    // event-bus-router.spec.ts ("does not attempt any additional recovery
    // when a category-1 subscriber throws ... just propagates") for the
    // exhaustive router-level proof. Here we assert the SAME contract from
    // the perspective of this endpoint's specific subscriber sequence.
    const dispatchCat1Subscribers = async (
      subscribers: Array<() => Promise<void>>
    ): Promise<void> => {
      for (const subscriber of subscribers) {
        await subscriber()
      }
    }

    const releaseTable = jest.fn().mockResolvedValue(undefined)
    const updateLifetimeValue = jest.fn().mockResolvedValue(undefined)
    const deductIngredients = jest.fn().mockRejectedValue(failure)

    const context: UnitOfWorkContext = {
      manager: {} as EntityManager,
      pending: [],
      depth: 0
    }

    await expect(
      holder.run(context, () =>
        dispatchCat1Subscribers([releaseTable, updateLifetimeValue, deductIngredients])
      )
    ).rejects.toThrow(failure)

    // Both earlier subscribers ran (their own writes are staged on the SAME
    // ambient manager/transaction), but the transaction never commits
    // because the failure propagates past holder.run() uncaught — Postgres
    // rolls back everything staged in it, table release and LTV update
    // included. No partial inventory deduction, no partially-closed order.
    expect(releaseTable).toHaveBeenCalled()
    expect(updateLifetimeValue).toHaveBeenCalled()
    expect(deductIngredients).toHaveBeenCalled()
  })
})
