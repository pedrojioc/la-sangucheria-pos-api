import { DataSource, EntityManager, Repository } from 'typeorm'

import { TypeOrmProductOptionGroupRepository } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/typeorm-product-option-group.repository'
import { ProductOptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/product-option-group.entity'
import { OptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/option-group.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmProductOptionGroupRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<ProductOptionGroupEntity> => {
    return {
      target: ProductOptionGroupEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      find: jest.fn().mockResolvedValue([])
    } as unknown as Repository<ProductOptionGroupEntity>
  }

  const buildDefaultGroupRepository = (): Repository<OptionGroupEntity> => {
    return {
      target: OptionGroupEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager
    } as unknown as Repository<OptionGroupEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultGroupRepository = buildDefaultGroupRepository()
    const dataSource = {} as unknown as DataSource
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmProductOptionGroupRepository(
      defaultRepository,
      defaultGroupRepository,
      dataSource,
      holder
    )

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  describe('replaceForProduct (D8 dual-path atomicity)', () => {
    it('opens its own short-lived transaction when no ambient context exists', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultGroupRepository = buildDefaultGroupRepository()

      const txManager = {
        delete: jest.fn(),
        create: jest.fn((_entity, row) => row),
        save: jest.fn()
      }
      const dataSourceTransaction = jest.fn().mockImplementation(work => work(txManager))
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmProductOptionGroupRepository(
        defaultRepository,
        defaultGroupRepository,
        dataSource,
        holder
      )

      const productId = UuidMother.random()
      const groupId = UuidMother.random()

      await repository.replaceForProduct(productId, [{ groupId, sortOrder: 0 }])

      expect(dataSourceTransaction).toHaveBeenCalledTimes(1)
      expect(txManager.delete).toHaveBeenCalledWith(ProductOptionGroupEntity, { productId })
      expect(txManager.save).toHaveBeenCalledWith(
        ProductOptionGroupEntity,
        expect.arrayContaining([expect.objectContaining({ productId, optionGroupId: groupId })])
      )
    })

    it('joins the ambient transaction instead of opening its own when a context exists', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultGroupRepository = buildDefaultGroupRepository()

      const dataSourceTransaction = jest.fn()
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmProductOptionGroupRepository(
        defaultRepository,
        defaultGroupRepository,
        dataSource,
        holder
      )

      const ambientDelete = jest.fn()
      const ambientCreate = jest.fn((_entity, row) => row)
      const ambientSave = jest.fn()
      const ambientManager = {
        delete: ambientDelete,
        create: ambientCreate,
        save: ambientSave
      } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const productId = UuidMother.random()
      const groupId = UuidMother.random()

      await holder.run(context, () =>
        repository.replaceForProduct(productId, [{ groupId, sortOrder: 0 }])
      )

      expect(dataSourceTransaction).not.toHaveBeenCalled()
      expect(ambientDelete).toHaveBeenCalledWith(ProductOptionGroupEntity, { productId })
      expect(ambientSave).toHaveBeenCalledWith(
        ProductOptionGroupEntity,
        expect.arrayContaining([expect.objectContaining({ productId, optionGroupId: groupId })])
      )
    })
  })

  describe('findByProductId (base-class resolution)', () => {
    it('falls back to the injected default repository when no ambient transaction exists', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultGroupRepository = buildDefaultGroupRepository()
      const dataSource = {} as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmProductOptionGroupRepository(
        defaultRepository,
        defaultGroupRepository,
        dataSource,
        holder
      )

      await repository.findByProductId(UuidMother.random())

      expect(defaultRepository.find).toHaveBeenCalledTimes(1)
    })

    it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultGroupRepository = buildDefaultGroupRepository()
      const dataSource = {} as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmProductOptionGroupRepository(
        defaultRepository,
        defaultGroupRepository,
        dataSource,
        holder
      )

      const scopedFind = jest.fn().mockResolvedValue([])
      const scopedRepository = {
        find: scopedFind
      } as unknown as Repository<ProductOptionGroupEntity>
      const getRepository = jest.fn().mockReturnValue(scopedRepository)
      const ambientManager = { getRepository } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      await holder.run(context, () => repository.findByProductId(UuidMother.random()))

      expect(getRepository).toHaveBeenCalledWith(ProductOptionGroupEntity)
      expect(scopedFind).toHaveBeenCalledTimes(1)
      expect(defaultRepository.find).not.toHaveBeenCalled()
    })
  })
})
