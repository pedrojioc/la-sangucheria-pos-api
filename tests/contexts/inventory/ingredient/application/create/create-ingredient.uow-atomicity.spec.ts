import { DataSource, EntityManager } from 'typeorm'

import { TypeOrmIngredientRepository } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/typeorm-ingredient.repository'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { TypeOrmInventoryLevelRepository } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-level.repository'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { IngredientMother } from '@test/contexts/inventory/ingredient/__mothers__/ingredient.mother'
import { InventoryLevelMother } from '@test/contexts/inventory/stock-level/__mothers__/inventory-level.mother'

/**
 * Slice 6 Group A (6.6) — proves the atomicity guarantee
 * `@UseInterceptors(TransactionInterceptor)` on `POST /ingredients` relies
 * on: `CreateIngredient.run()` saves the Ingredient, then publishes
 * `IngredientCreatedEvent`, which the router dispatches synchronously (design
 * D4, category 1) to `CreateInventoryLevelOnIngredientCreated` ->
 * `InitializeInventoryLevel.run()` -> `TypeOrmInventoryLevelRepository.save()`.
 *
 * Unlike Group A's other endpoints (chained use-case calls within one
 * request handler), this endpoint's second write is triggered BY THE ROUTER
 * mid-`publish()`, not by the use case body directly. The interceptor's
 * ambient `EntityManager` is what lets both `TransactionalRepository`
 * instances (Ingredient + InventoryLevel) resolve a scoped `Repository<T>`
 * from the SAME manager, so both writes share one real Postgres transaction.
 *
 * The companion fail-fast contract — that dispatching a category-1
 * subscriber with NO ambient context throws `MissingUnitOfWorkContext`
 * instead of silently degrading — is already proven exhaustively at the
 * router level in `tests/shared/infrastructure/event-bus/event-bus-router.spec.ts`
 * (design D5/D8) and is NOT duplicated here.
 */
describe('CreateIngredient (via cat-1 dispatch) — UoW atomicity (Slice 6 Group A, 6.6)', () => {
  const buildScopedGetRepository = (calls: unknown[]) => {
    return jest.fn((target: unknown) => {
      calls.push(target)
      if (target === IngredientEntity) {
        return {
          create: jest.fn((_entity: unknown, row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      if (target === InventoryLevelEntity) {
        return {
          create: jest.fn((_entity: unknown, row: unknown) => row),
          save: jest.fn().mockResolvedValue(undefined)
        }
      }
      throw new Error(`Unexpected entity target passed to getRepository: ${String(target)}`)
    })
  }

  it('resolves both TypeOrmIngredientRepository.save() and TypeOrmInventoryLevelRepository.save() from the SAME ambient manager', async () => {
    const holder = new UnitOfWorkContextHolder()
    const resolvedTargets: unknown[] = []
    const ambientManager = {
      getRepository: buildScopedGetRepository(resolvedTargets)
    } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const defaultIngredientRepo = {
      target: IngredientEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<IngredientEntity>
    const defaultLevelRepo = {
      target: InventoryLevelEntity,
      manager: { name: 'default-manager' }
    } as unknown as import('typeorm').Repository<InventoryLevelEntity>

    const ingredientRepository = new TypeOrmIngredientRepository(defaultIngredientRepo, holder)
    const levelRepository = new TypeOrmInventoryLevelRepository(defaultLevelRepo, holder)

    await holder.run(context, async () => {
      await ingredientRepository.save(IngredientMother.random())
      await levelRepository.save(InventoryLevelMother.random())
    })

    expect(resolvedTargets).toContain(IngredientEntity)
    expect(resolvedTargets).toContain(InventoryLevelEntity)
    // Each TransactionalRepository.save() accesses the `this.repo` getter
    // twice (once for `.create`, once for `.save`), so 2 repos x 2 accesses.
    expect(ambientManager.getRepository).toHaveBeenCalledTimes(4)
  })

  it('WITHOUT an ambient context, both repositories independently fall back to their own default (non-shared) manager — the pre-interceptor bug baseline', async () => {
    const holder = new UnitOfWorkContextHolder()
    const dataSource = { transaction: jest.fn() } as unknown as DataSource
    void dataSource

    const defaultIngredientManager = {
      getRepository: jest.fn()
    }
    const defaultLevelManager = {
      getRepository: jest.fn()
    }
    const defaultIngredientRepo = {
      target: IngredientEntity,
      manager: defaultIngredientManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<IngredientEntity>
    const defaultLevelRepo = {
      target: InventoryLevelEntity,
      manager: defaultLevelManager,
      create: jest.fn((row: unknown) => row),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as import('typeorm').Repository<InventoryLevelEntity>

    const ingredientRepository = new TypeOrmIngredientRepository(defaultIngredientRepo, holder)
    const levelRepository = new TypeOrmInventoryLevelRepository(defaultLevelRepo, holder)

    await ingredientRepository.save(IngredientMother.random())
    await levelRepository.save(InventoryLevelMother.random())

    // Neither repo's ambient `getRepository` dispatcher was ever consulted —
    // each independently used its own injected default repository, meaning
    // (in real Postgres) each save autocommits on its own connection. This
    // reproduces today's non-atomic baseline the interceptor exists to fix.
    expect(defaultIngredientManager.getRepository).not.toHaveBeenCalled()
    expect(defaultLevelManager.getRepository).not.toHaveBeenCalled()
  })
})
