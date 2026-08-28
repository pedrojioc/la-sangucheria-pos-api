import { EntityManager, Repository } from 'typeorm'

import { TypeOrmRecipeRepository } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/typeorm-recipe.repository'
import { RecipeEntity } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe.entity'
import { RecipeItemEntity } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe-item.entity'
import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'
import { RecipeItem } from '@contexts/kitchen/recipe/domain/recipe-item'
import { RecipeYield } from '@contexts/kitchen/recipe/domain/recipe-yield'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmRecipeRepository (ambient UnitOfWork wiring)', () => {
  const buildRecipe = (): Recipe =>
    Recipe.create(
      UuidMother.random(),
      'Salsa criolla',
      [RecipeItem.create(UuidMother.random(), 1, UuidMother.random())],
      RecipeYield.create(4, UuidMother.random())
    )

  const buildDefaultRepository = (): Repository<RecipeEntity> => {
    return {
      target: RecipeEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<RecipeEntity>
  }

  const buildDefaultItemRepository = (): Repository<RecipeItemEntity> => {
    return {
      target: RecipeItemEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn(),
      delete: jest.fn()
    } as unknown as Repository<RecipeItemEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRecipeRepository(defaultRepository, defaultItemRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRecipeRepository(defaultRepository, defaultItemRepository, holder)

    await repository.save(buildRecipe())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmRecipeRepository(defaultRepository, defaultItemRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<RecipeEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildRecipe()))

    expect(getRepository).toHaveBeenCalledWith(RecipeEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
