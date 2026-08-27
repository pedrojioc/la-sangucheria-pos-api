import { DataSource, Repository } from 'typeorm'

import { TypeOrmKitchenBoardQueryService } from '@contexts/kitchen-operations/kitchen-board/infrastructure/query-services/typeorm-kitchen-board-query.service'
import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderMother } from '@test/contexts/orders/order/__mothers__/order.mother'
import { OrderItemMother } from '@test/contexts/orders/order/__mothers__/order-item.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { createE2eDataSource, cleanOrderTables } from './support/e2e-data-source'

/**
 * Real-Postgres coverage for TypeOrmKitchenBoardQueryService, closing the gap
 * left by tests/e2e/ not existing (design decision 4). The mocked
 * QueryBuilder unit tests can assert *call arguments* but cannot faithfully
 * simulate LEFT JOIN / ON-clause semantics — this suite executes the actual
 * SQL against Postgres.
 */
describe('TypeOrmKitchenBoardQueryService (e2e)', () => {
  let dataSource: DataSource
  let orderRepository: Repository<OrderEntity>
  let itemRepository: Repository<OrderItemEntity>
  let repository: TypeOrmOrderRepository
  let queryService: TypeOrmKitchenBoardQueryService

  beforeAll(async () => {
    dataSource = createE2eDataSource()
    await dataSource.initialize()
    orderRepository = dataSource.getRepository(OrderEntity)
    itemRepository = dataSource.getRepository(OrderItemEntity)
    repository = new TypeOrmOrderRepository(orderRepository, itemRepository, dataSource)
    queryService = new TypeOrmKitchenBoardQueryService(orderRepository)
  })

  afterAll(async () => {
    await cleanOrderTables(dataSource)
    await dataSource.destroy()
  })

  beforeEach(async () => {
    await cleanOrderTables(dataSource)
  })

  it('produces exactly one board group with items: [] for an OPEN order with zero order_items rows', async () => {
    const order = OrderMother.create({ status: OrderStatus.OPEN, items: [] })
    await repository.save(order)

    const board = await queryService.findActiveByStation()
    const group = board.find(g => g.orderId === order.toPrimitives().id)

    // Deliberately-wrong assertion first: asserting the group is absent
    // should fail — the LEFT JOIN must still produce exactly one row.
    expect(group).toBeDefined()
    expect(group!.items).toEqual([])
    expect(board.filter(g => g.orderId === order.toPrimitives().id)).toHaveLength(1)
  })

  it('filters and groups a mix of item statuses correctly by station+status predicate', async () => {
    const stationA = UuidMother.random()
    const stationB = UuidMother.random()

    const sentOnA = OrderItemMother.sent({ stationId: stationA })
    const readyOnA = OrderItemMother.ready({ stationId: stationA })
    const sentOnB = OrderItemMother.sent({ stationId: stationB })
    const pendingOnA = OrderItemMother.pending({ stationId: stationA })
    const deliveredOnA = OrderItemMother.delivered({ stationId: stationA })

    const order = OrderMother.create({
      status: OrderStatus.IN_PROGRESS,
      items: [sentOnA, readyOnA, sentOnB, pendingOnA, deliveredOnA]
    })
    await repository.save(order)

    const unfiltered = await queryService.findActiveByStation()
    const unfilteredGroup = unfiltered.find(g => g.orderId === order.toPrimitives().id)!
    const unfilteredItemIds = unfilteredGroup.items.map(i => i.itemId).sort()
    expect(unfilteredItemIds).toEqual([sentOnA.id, readyOnA.id, sentOnB.id].sort())

    const filteredByStationA = await queryService.findActiveByStation(stationA)
    const groupA = filteredByStationA.find(g => g.orderId === order.toPrimitives().id)!
    const stationAItemIds = groupA.items.map(i => i.itemId).sort()
    expect(stationAItemIds).toEqual([sentOnA.id, readyOnA.id].sort())

    const filteredByStationB = await queryService.findActiveByStation(stationB)
    const groupB = filteredByStationB.find(g => g.orderId === order.toPrimitives().id)!
    expect(groupB.items.map(i => i.itemId)).toEqual([sentOnB.id])
  })

  it('excludes CANCELLED and DELIVERED order rows from board items but keeps the order group', async () => {
    const sentItem = OrderItemMother.sent()
    const cancelledItem = OrderItemMother.cancelled()
    const order = OrderMother.create({
      status: OrderStatus.IN_PROGRESS,
      items: [sentItem, cancelledItem]
    })
    await repository.save(order)

    const board = await queryService.findActiveByStation()
    const group = board.find(g => g.orderId === order.toPrimitives().id)!

    expect(group.items.map(i => i.itemId)).toEqual([sentItem.id])
  })
})
