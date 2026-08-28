import { DataSource, EntityManager, Repository } from 'typeorm'

import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { OrderMother } from '@test/contexts/orders/order/__mothers__/order.mother'
import { OrderItemMother } from '@test/contexts/orders/order/__mothers__/order-item.mother'

describe('TypeOrmOrderRepository (ambient UnitOfWork wiring)', () => {
  const buildDefaultRepository = (): Repository<OrderEntity> => {
    return {
      target: OrderEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager
    } as unknown as Repository<OrderEntity>
  }

  const buildDefaultItemRepository = (): Repository<OrderItemEntity> => {
    return {
      target: OrderItemEntity,
      manager: { name: 'default-manager' } as unknown as EntityManager
    } as unknown as Repository<OrderItemEntity>
  }

  it('extends TransactionalRepository', () => {
    const defaultRepository = buildDefaultRepository()
    const defaultItemRepository = buildDefaultItemRepository()
    const dataSource = {} as unknown as DataSource
    const holder = new UnitOfWorkContextHolder()
    const repository = new TypeOrmOrderRepository(
      defaultRepository,
      defaultItemRepository,
      dataSource,
      holder
    )

    expect(repository).toBeInstanceOf(TransactionalRepository)
  })

  describe('save (composes with the ambient transaction, no own dataSource.transaction())', () => {
    it('writes through the injected default manager when no ambient transaction exists', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const dataSourceTransaction = jest.fn()
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()

      const defaultManagerSave = jest.fn()
      const defaultManagerCreate = jest.fn((_entity, row) => row)
      const defaultManagerQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn()
      }
      ;(defaultRepository.manager as unknown as Record<string, unknown>) = {
        save: defaultManagerSave,
        create: defaultManagerCreate,
        createQueryBuilder: jest.fn().mockReturnValue(defaultManagerQueryBuilder)
      }

      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      await repository.save(OrderMother.inProgress([]))

      expect(dataSourceTransaction).not.toHaveBeenCalled()
      expect(defaultManagerSave).toHaveBeenCalledWith(OrderEntity, expect.any(Object))
    })

    it('writes through the ambient manager when a transaction is active', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const dataSourceTransaction = jest.fn()
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      const ambientSave = jest.fn()
      const ambientCreate = jest.fn((_entity, row) => row)
      const ambientQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn()
      }
      const ambientManager = {
        save: ambientSave,
        create: ambientCreate,
        createQueryBuilder: jest.fn().mockReturnValue(ambientQueryBuilder)
      } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      await holder.run(context, () => repository.save(OrderMother.inProgress([])))

      expect(dataSourceTransaction).not.toHaveBeenCalled()
      expect(ambientSave).toHaveBeenCalledWith(OrderEntity, expect.any(Object))
    })
  })

  describe('save (Slice 6 Group B atomicity: order + item writes roll back together)', () => {
    // Proves the atomicity guarantee Slice 6 Group B's `@UseInterceptors
    // (TransactionInterceptor)` endpoints rely on: `save()` issues 2-3
    // statements (order upsert, item DELETE-diff, item upsert) against ONE
    // ambient EntityManager supplied by `dataSource.transaction()`. This test
    // simulates the real TypeORM contract at the mock boundary (matching this
    // suite's established precedent, since `pnpm test` runs the "unit" jest
    // project only — no real Postgres, see tests/e2e for that tier): when the
    // downstream item-upsert statement rejects, the promise returned by
    // `dataSource.transaction()`'s worker function rejects too, so TypeORM's
    // real `transaction()` implementation would roll back the ENTIRE
    // transaction — including the order-level write that already ran on the
    // same manager. We assert both (a) the order write already happened on
    // the shared manager before the failure, and (b) the overall operation
    // surfaces the failure instead of swallowing it — i.e. nothing can commit
    // partially, because both statements share one manager/one transaction.
    it('rolls back the whole save() when the item upsert fails, after the order write already ran on the same manager', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const dataSource = {} as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      const itemUpsertFailure = new Error('item upsert failed: unique constraint violation')
      const ambientSave = jest
        .fn()
        // 1st call: order upsert (manager.save(OrderEntity, ...)) succeeds
        .mockResolvedValueOnce(undefined)
        // 2nd call: item upsert (manager.save(OrderItemEntity, items)) fails
        .mockRejectedValueOnce(itemUpsertFailure)
      const ambientCreate = jest.fn((_entity, row) => row)
      const ambientQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined)
      }
      const ambientManager = {
        save: ambientSave,
        create: ambientCreate,
        createQueryBuilder: jest.fn().mockReturnValue(ambientQueryBuilder)
      } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const order = OrderMother.inProgress([OrderItemMother.pending()])

      await expect(holder.run(context, () => repository.save(order))).rejects.toBe(
        itemUpsertFailure
      )

      // The order-level write DID already execute against the SAME ambient
      // manager that TransactionInterceptor's dataSource.transaction() would
      // supply. Because it is the same manager/transaction as the failed item
      // upsert, a real Postgres transaction rolls both back together — this
      // is what makes the operation atomic. If save() opened separate
      // transactions (or wrote through the default, non-ambient manager) the
      // order row could survive independently of the failed item write,
      // which is exactly the corruption Slice 6 Group B exists to prevent.
      expect(ambientSave).toHaveBeenNthCalledWith(1, OrderEntity, expect.any(Object))
      expect(ambientSave).toHaveBeenNthCalledWith(2, OrderItemEntity, expect.any(Array))
      expect(ambientSave).toHaveBeenCalledTimes(2)
    })

    it('rolls back when the order-level write itself fails, before any item statement runs', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const dataSource = {} as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      const orderWriteFailure = new Error('order upsert failed: connection reset')
      const ambientSave = jest.fn().mockRejectedValueOnce(orderWriteFailure)
      const ambientCreate = jest.fn((_entity, row) => row)
      const ambientQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined)
      }
      const ambientManager = {
        save: ambientSave,
        create: ambientCreate,
        createQueryBuilder: jest.fn().mockReturnValue(ambientQueryBuilder)
      } as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const order = OrderMother.inProgress([OrderItemMother.pending()])

      await expect(holder.run(context, () => repository.save(order))).rejects.toBe(
        orderWriteFailure
      )

      // No item-side statement was ever reached — the delete-diff query
      // builder and the item upsert never ran, so there is nothing partial
      // to roll back on the item side either; the failure propagates before
      // any further write is attempted.
      expect(ambientQueryBuilder.execute).not.toHaveBeenCalled()
      expect(ambientSave).toHaveBeenCalledTimes(1)
    })
  })

  describe('nextOrderNumber (keeps its own independent dataSource.transaction())', () => {
    it('always opens its own transaction, even with no ambient context', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const txManager = {
        query: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce([[{ last_number: 1 }]])
      }
      const dataSourceTransaction = jest.fn().mockImplementation(work => work(txManager))
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      const orderNumber = await repository.nextOrderNumber(new Date('2026-01-01'))

      expect(dataSourceTransaction).toHaveBeenCalledTimes(1)
      expect(orderNumber).toBe('001')
    })

    it('still opens its own independent transaction when an ambient context exists (does not join it)', async () => {
      const defaultRepository = buildDefaultRepository()
      const defaultItemRepository = buildDefaultItemRepository()
      const txManager = {
        query: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce([[{ last_number: 7 }]])
      }
      const dataSourceTransaction = jest.fn().mockImplementation(work => work(txManager))
      const dataSource = { transaction: dataSourceTransaction } as unknown as DataSource
      const holder = new UnitOfWorkContextHolder()
      const repository = new TypeOrmOrderRepository(
        defaultRepository,
        defaultItemRepository,
        dataSource,
        holder
      )

      const ambientManager = {} as unknown as EntityManager
      const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

      const orderNumber = await holder.run(context, () =>
        repository.nextOrderNumber(new Date('2026-01-01'))
      )

      expect(dataSourceTransaction).toHaveBeenCalledTimes(1)
      expect(orderNumber).toBe('007')
    })
  })
})
