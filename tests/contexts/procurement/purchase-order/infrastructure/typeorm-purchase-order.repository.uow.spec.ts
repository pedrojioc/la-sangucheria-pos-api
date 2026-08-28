import { EntityManager, Repository } from 'typeorm'

import { TypeOrmPurchaseOrderRepository } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/typeorm-purchase-order.repository'
import { PurchaseOrderEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from '@contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order-item.entity'
import { PurchaseOrder } from '@contexts/procurement/purchase-order/domain/purchase-order'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { PurchaseOrderMother } from '@test/contexts/procurement/purchase-order/__mothers__/PurchaseOrderMother'

describe('TypeOrmPurchaseOrderRepository (ambient UnitOfWork wiring)', () => {
  const buildPurchaseOrder = (): PurchaseOrder => PurchaseOrderMother.random()

  const buildDefaultRepository = (): Repository<PurchaseOrderEntity> => {
    return {
      target: PurchaseOrderEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn()
    } as unknown as Repository<PurchaseOrderEntity>
  }

  const buildDefaultItemRepository = (): Repository<PurchaseOrderItemEntity> => {
    return {
      target: PurchaseOrderItemEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager,
      create: jest.fn(entity => entity),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn()
      })
    } as unknown as Repository<PurchaseOrderItemEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPurchaseOrderRepository(
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
    const repository = new TypeOrmPurchaseOrderRepository(
      defaultRepository,
      defaultItemRepository,
      holder
    )

    await repository.save(buildPurchaseOrder())

    expect(defaultRepository.save).toHaveBeenCalledTimes(1)
  })

  it('resolves the scoped repository from the ambient manager when a transaction is active', async () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmPurchaseOrderRepository(
      defaultRepository,
      defaultItemRepository,
      holder
    )

    const scopedSave = jest.fn()
    const scopedRepository = {
      create: jest.fn(entity => entity),
      save: scopedSave
    } as unknown as Repository<PurchaseOrderEntity>
    const getRepository = jest.fn().mockReturnValue(scopedRepository)
    const ambientManager = { getRepository } as unknown as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    await holder.run(context, () => repository.save(buildPurchaseOrder()))

    expect(getRepository).toHaveBeenCalledWith(PurchaseOrderEntity)
    expect(scopedSave).toHaveBeenCalledTimes(1)
    expect(defaultRepository.save).not.toHaveBeenCalled()
  })
})
