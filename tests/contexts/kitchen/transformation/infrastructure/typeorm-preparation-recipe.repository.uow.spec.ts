import { EntityManager, Repository } from 'typeorm'

import { TypeOrmPreparationRecipeRepository } from '@contexts/kitchen/transformation/infrastructure/persistence/typeorm/typeorm-preparation-recipe.repository'
import { PreparationRecipeEntity } from '@contexts/kitchen/transformation/infrastructure/persistence/typeorm/preparation-recipe.entity'
import { PreparationRecipeIngredientEntity } from '@contexts/kitchen/transformation/infrastructure/persistence/typeorm/preparation-recipe-ingredient.entity'
import { PreparationRecipe } from '@contexts/kitchen/transformation/domain/preparation-recipe'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmPreparationRecipeRepository (ambient UnitOfWork wiring)', () => {
  const buildPreparationRecipe = (): PreparationRecipe =>
    PreparationRecipe.create(
      UuidMother.random(),
      'Fondo de pollo',
      UuidMother.random(),
      UuidMother.random(),
      85
    )

  const buildDefaultRepository = (): Repository<PreparationRecipeEntity> => {
    return {
      target: PreparationRecipeEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<PreparationRecipeEntity>
  }

  const buildDefaultIngredientRepository = (): Repository<PreparationRecipeIngredientEntity> => {
    return {
      target: PreparationRecipeIngredientEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn(),
      delete: jest.fn()
    } as unknown as Repository<PreparationRecipeIngredientEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultIngredientRepository = buildDefaultIngredientRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPreparationRecipeRepository(
      defaultRepository,
      defaultIngredientRepository,
      holder
    )

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultIngredientRepository = buildDefaultIngredientRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPreparationRecipeRepository(
      defaultRepository,
      defaultIngredientRepository,
      holder
    )

    await repository.save(buildPreparationRecipe())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultIngredientRepository = buildDefaultIngredientRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPreparationRecipeRepository(
      defaultRepository,
      defaultIngredientRepository,
      holder
    )

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<PreparationRecipeEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildPreparationRecipe()))

    expect(getRepository).toHaveBeenCalledWith(PreparationRecipeEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
