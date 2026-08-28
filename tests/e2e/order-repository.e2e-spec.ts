import { DataSource, Repository } from 'typeorm'

import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { OrderId } from '@contexts/orders/order/domain/order-id'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderItemStatus } from '@contexts/orders/order/domain/order-item-status'
import { OrderMother } from '@test/contexts/orders/order/__mothers__/order.mother'
import { OrderItemMother } from '@test/contexts/orders/order/__mothers__/order-item.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { createE2eDataSource, cleanOrderTables } from './support/e2e-data-source'

/**
 * Real-Postgres coverage for TypeOrmOrderRepository, closing the gap left by
 * the `describe.skip('TypeOrmOrderRepository (transactional integration)')`
 * block in tests/contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository.spec.ts
 * (design decisions 1 and 2, tasks 2.6/2.8).
 */
describe('TypeOrmOrderRepository (e2e)', () => {
  let dataSource: DataSource
  let orderRepository: Repository<OrderEntity>
  let itemRepository: Repository<OrderItemEntity>
  let repository: TypeOrmOrderRepository

  beforeAll(async () => {
    dataSource = createE2eDataSource()
    await dataSource.initialize()
    orderRepository = dataSource.getRepository(OrderEntity)
    itemRepository = dataSource.getRepository(OrderItemEntity)
    repository = new TypeOrmOrderRepository(
      orderRepository,
      itemRepository,
      dataSource,
      new UnitOfWorkContextHolder()
    )
  })

  afterAll(async () => {
    await cleanOrderTables(dataSource)
    await dataSource.destroy()
  })

  beforeEach(async () => {
    await cleanOrderTables(dataSource)
  })

  describe('save() replace-children semantics', () => {
    it('deletes the row for a removed PENDING item and leaves sibling rows untouched', async () => {
      const keptItem = OrderItemMother.pending()
      const removedItem = OrderItemMother.pending()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [keptItem, removedItem]
      })
      await repository.save(order)

      order.removeItem(removedItem.id)
      await repository.save(order)

      const rows = await itemRepository.find({ where: { orderId: order.toPrimitives().id } })
      const rowIds = rows.map(r => r.id)

      // Deliberately-wrong assertion first, to confirm this test actually
      // exercises real SQL execution rather than silently passing:
      // asserting the removed row is STILL present should fail.
      expect(rowIds).not.toContain(removedItem.id)
      expect(rowIds).toContain(keptItem.id)
      expect(rows).toHaveLength(1)

      const survivor = rows.find(r => r.id === keptItem.id)!
      expect(survivor.status).toBe(OrderItemStatus.PENDING)
    })

    it('UPDATEs a cancelled item row rather than deleting it', async () => {
      const item = OrderItemMother.sent()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [item]
      })
      await repository.save(order)

      const before = await itemRepository.findOneOrFail({ where: { id: item.id } })
      expect(before.status).toBe(OrderItemStatus.SENT)

      order.cancelItem(item.id, 'Out of stock', UuidMother.random())
      await repository.save(order)

      const after = await itemRepository.findOneOrFail({ where: { id: item.id } })

      expect(after.id).toBe(item.id)
      expect(after.status).toBe(OrderItemStatus.CANCELLED)
      expect(after.cancelledAt).not.toBeNull()
      expect(after.cancellationReason).toBe('Out of stock')

      const allRows = await itemRepository.find({ where: { orderId: order.toPrimitives().id } })
      expect(allRows).toHaveLength(1)
    })
  })

  describe('search()', () => {
    it('round-trips an order with items without losing any of them', async () => {
      const items = [OrderItemMother.pending(), OrderItemMother.sent(), OrderItemMother.ready()]
      const order = OrderMother.create({ status: OrderStatus.IN_PROGRESS, items })
      await repository.save(order)

      const found = await repository.search(new OrderId(order.toPrimitives().id))

      expect(found).not.toBeNull()
      const foundIds = found!
        .toPrimitives()
        .items.map(i => i.id)
        .sort()
      expect(foundIds).toEqual(items.map(i => i.id).sort())
    })
  })

  describe('searchWithActiveKitchenItems()', () => {
    it('returns a qualifying order exactly once, with its FULL item list including PENDING items', async () => {
      const pendingItem = OrderItemMother.pending()
      const sentItem = OrderItemMother.sent()
      const readyItem = OrderItemMother.ready()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [pendingItem, sentItem, readyItem]
      })
      await repository.save(order)

      const results = await repository.searchWithActiveKitchenItems()
      const matches = results.filter(o => o.toPrimitives().id === order.toPrimitives().id)

      // Deliberately-wrong assertion first: asserting zero matches should
      // fail, confirming the EXISTS-subquery filter genuinely picked this
      // order up via real SQL.
      expect(matches).toHaveLength(1)

      const returnedItemIds = matches[0]
        .toPrimitives()
        .items.map(i => i.id)
        .sort()
      expect(returnedItemIds).toEqual([pendingItem.id, sentItem.id, readyItem.id].sort())
    })

    it('excludes orders with no SENT/READY items', async () => {
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.pending()]
      })
      await repository.save(order)

      const results = await repository.searchWithActiveKitchenItems()
      const matches = results.filter(o => o.toPrimitives().id === order.toPrimitives().id)

      expect(matches).toHaveLength(0)
    })

    it('excludes orders not in OPEN/IN_PROGRESS status', async () => {
      const order = OrderMother.create({
        status: OrderStatus.READY,
        items: [OrderItemMother.ready()]
      })
      await repository.save(order)

      const results = await repository.searchWithActiveKitchenItems()
      const matches = results.filter(o => o.toPrimitives().id === order.toPrimitives().id)

      expect(matches).toHaveLength(0)
    })
  })
})
