import { EntityManager, Repository } from 'typeorm'

import { TypeOrmOptionGroupRepository } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/typeorm-option-group.repository'
import { OptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/option-group.entity'
import { OptionItemEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/option-item.entity'
import { ProductOptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/product-option-group.entity'
import { OptionGroup } from '@contexts/menu/product-option/domain/option-group'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { OptionGroupMother } from '@test/contexts/menu/product-option/__mothers__/option-group.mother'

describe('TypeOrmOptionGroupRepository (ambient UnitOfWork wiring)', () => {
  const buildOptionGroup = (): OptionGroup => OptionGroupMother.random()

  const buildDefaultRepository = (): Repository<OptionGroupEntity> => {
    return {
      target: OptionGroupEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<OptionGroupEntity>
  }

  const buildDefaultItemRepository = (): Repository<OptionItemEntity> => {
    return {
      target: OptionItemEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn(),
      delete: jest.fn()
    } as unknown as Repository<OptionItemEntity>
  }

  const buildDefaultPivotRepository = (): Repository<ProductOptionGroupEntity> => {
    return {
      target: ProductOptionGroupEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      count: jest.fn()
    } as unknown as Repository<ProductOptionGroupEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const defaultPivotRepository = buildDefaultPivotRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmOptionGroupRepository(
      defaultRepository,
      defaultItemRepository,
      defaultPivotRepository,
      holder
    )

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  it('falls back to the injected default repository when no ambient transaction exists', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const defaultPivotRepository = buildDefaultPivotRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmOptionGroupRepository(
      defaultRepository,
      defaultItemRepository,
      defaultPivotRepository,
      holder
    )

    await repository.save(buildOptionGroup())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const defaultPivotRepository = buildDefaultPivotRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmOptionGroupRepository(
      defaultRepository,
      defaultItemRepository,
      defaultPivotRepository,
      holder
    )

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<OptionGroupEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildOptionGroup()))

    expect(getRepository).toHaveBeenCalledWith(OptionGroupEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
