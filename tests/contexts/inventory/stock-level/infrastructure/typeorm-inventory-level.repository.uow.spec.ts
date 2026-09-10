import { EntityManager, Repository } from 'typeorm'

import { TypeOrmInventoryLevelRepository } from '@/contexts/inventory/stock-level/infrastructure/persistence/typeorm/typeorm-inventory-level.repository'
import { InventoryLevelEntity } from '@/contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryLevelMother } from '../__mothers__/inventory-level.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmInventoryLevelRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<InventoryLevelEntity> => {
    return {
      target: InventoryLevelEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<InventoryLevelEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryLevelRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryLevelRepository(defaultRepository, holder)

    await repository.save(InventoryLevelMother.random())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmInventoryLevelRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<InventoryLevelEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(InventoryLevelMother.random()))

    expect(getRepository).toHaveBeenCalledWith(InventoryLevelEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })

  describe('findByIngredientForUpdate', () => {
    it('locks the row via a pessimistic_write query builder and maps the result', async () => {
      const defaultRepository = buildDefaultRepository()
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmInventoryLevelRepository(defaultRepository, holder)

      const level = InventoryLevelMother.random()
      const primitives = level.toPrimitives()
      const entity: Partial<InventoryLevelEntity> = {
        id: primitives.id,
        ingredientId: primitives.ingredientId,
        currentQuantity: primitives.currentQuantity,
        unitId: primitives.unitId,
        minimumQuantity: primitives.minimumQuantity ?? 0,
        maximumQuantity: primitives.maximumQuantity,
        reorderPoint: primitives.reorderPoint
      }

      const getOne = jest.fn().mockResolvedValue(entity)
      const where = jest.fn().mockReturnValue({ getOne })
      const setLock = jest.fn().mockReturnValue({ where })
      const createQueryBuilder = jest.fn().mockReturnValue({ setLock })
      const ambientManager = { createQueryBuilder } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const ingredientId = new IngredientId(primitives.ingredientId)

      const result = await holder.run(context, () =>
        repository.findByIngredientForUpdate(ingredientId)
      )

      expect(createQueryBuilder).toHaveBeenCalledWith(InventoryLevelEntity, 'level')
      expect(setLock).toHaveBeenCalledWith('pessimistic_write')
      expect(where).toHaveBeenCalledWith('level.ingredient_id = :ingredientId', {
        ingredientId: primitives.ingredientId
      })
      expect(result?.toPrimitives()).toEqual(primitives)
    })

    it('returns null when no row is found', async () => {
      const defaultRepository = buildDefaultRepository()
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmInventoryLevelRepository(defaultRepository, holder)

      const getOne = jest.fn().mockResolvedValue(null)
      const where = jest.fn().mockReturnValue({ getOne })
      const setLock = jest.fn().mockReturnValue({ where })
      const createQueryBuilder = jest.fn().mockReturnValue({ setLock })
      const ambientManager = { createQueryBuilder } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const result = await holder.run(context, () =>
        repository.findByIngredientForUpdate(new IngredientId(UuidMother.random()))
      )

      expect(result).toBeNull()
    })
  })
})
