import { EntityManager, Repository } from 'typeorm'

import { TypeOrmProductCategoryRepository } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/typeorm-product-category.repository'
import { ProductCategoryEntity } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/product-category.entity'
import { ProductCategory } from '@/contexts/menu/product-category/domain/product-category'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmProductCategoryRepository (ambient UnitOfWork wiring)', () => {
  const buildProductCategory = (): ProductCategory =>
    ProductCategory.create(UuidMother.random(), 'Bebidas', null, null, null, true, 0)

  const buildDefaultRepository = (): Repository<ProductCategoryEntity> => {
    return {
      target: ProductCategoryEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<ProductCategoryEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductCategoryRepository(defaultRepository, holder)

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductCategoryRepository(defaultRepository, holder)

    await repository.save(buildProductCategory())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductCategoryRepository(defaultRepository, holder)

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<ProductCategoryEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildProductCategory()))

    expect(getRepository).toHaveBeenCalledWith(ProductCategoryEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
