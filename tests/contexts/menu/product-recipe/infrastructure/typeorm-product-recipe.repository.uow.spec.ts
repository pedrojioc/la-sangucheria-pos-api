import { EntityManager, Repository } from 'typeorm'

import { TypeOrmProductRecipeRepository } from '@contexts/menu/product-recipe/infrastructure/persistence/typeorm/typeorm-product-recipe.repository'
import { ProductRecipeEntity } from '@contexts/menu/product-recipe/infrastructure/persistence/typeorm/product-recipe.entity'
import { ProductRecipeItemEntity } from '@contexts/menu/product-recipe/infrastructure/persistence/typeorm/product-recipe-item.entity'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeItem } from '@contexts/menu/product-recipe/domain/product-recipe-item'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmProductRecipeRepository (ambient UnitOfWork wiring)', () => {
  const buildProductRecipe = (): ProductRecipe =>
    ProductRecipe.create(UuidMother.random(), UuidMother.random(), [
      ProductRecipeItem.create(UuidMother.random(), 1, UuidMother.random())
    ])

  const buildDefaultRepository = (): Repository<ProductRecipeEntity> => {
    return {
      target: ProductRecipeEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<ProductRecipeEntity>
  }

  const buildDefaultItemRepository = (): Repository<ProductRecipeItemEntity> => {
    return {
      target: ProductRecipeItemEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn(),
      delete: jest.fn()
    } as unknown as Repository<ProductRecipeItemEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductRecipeRepository(
      defaultRepository,
      defaultItemRepository,
      holder
    )

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductRecipeRepository(
      defaultRepository,
      defaultItemRepository,
      holder
    )

    await repository.save(buildProductRecipe())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductRecipeRepository(
      defaultRepository,
      defaultItemRepository,
      holder
    )

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<ProductRecipeEntity>
    const scopedItemSave = jest.fn()
    const scopedItemDelete = jest.fn()
    const scopedItemRepository = {
      create: jest.fn(entity => entity),
      save: scopedItemSave,
      delete: scopedItemDelete
    } as unknown as Repository<ProductRecipeItemEntity>
    const getRepository = jest.fn(target =>
      target === ProductRecipeItemEntity ? scopedItemRepository : scopedRepository
    )
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildProductRecipe()))

    expect(getRepository).toHaveBeenCalledWith(ProductRecipeEntity)
    expect(getRepository).toHaveBeenCalledWith(ProductRecipeItemEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(scopedItemDelete).toHaveBeenCalledTimes(1)
    expect(scopedItemSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
    expect(defaultItemRepository.save).not.toHaveBeenCalled()
  })
})
