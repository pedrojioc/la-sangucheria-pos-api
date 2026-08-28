import { EntityManager, Repository } from 'typeorm'

import { TypeOrmIngredientCategoryRepository } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/typeorm-ingredient-category.repository'
import { IngredientCategoryEntity } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { IngredientCategoryMother } from '../__mothers__/ingredient-category.mother'

describe('TypeOrmIngredientCategoryRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<IngredientCategoryEntity> => {
    return {
      target: IngredientCategoryEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<IngredientCategoryEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientCategoryRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientCategoryRepository(defaultRepository, holder)

    await repository.save(IngredientCategoryMother.carnes())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmIngredientCategoryRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<IngredientCategoryEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(IngredientCategoryMother.carnes()))

    expect(getRepository).toHaveBeenCalledWith(IngredientCategoryEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
