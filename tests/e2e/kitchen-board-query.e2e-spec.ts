import { DataSource, Repository } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderMother } from '@test/contexts/orders/order/__mothers__/order.mother'
import { OrderItemMother } from '@test/contexts/orders/order/__mothers__/order-item.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { KitchenBoardOrderGroup } from '@contexts/kitchen-operations/kitchen-board/application/dto/kitchen-board.response'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables, ORDER_TABLES } from './support/truncate'

/**
 * Real-Postgres coverage for the kitchen board read path, closing the gap
 * left by tests/e2e/ not existing (design decision 4). The mocked
 * QueryBuilder unit tests can assert *call arguments* but cannot faithfully
 * simulate LEFT JOIN / ON-clause semantics — this suite executes the actual
 * SQL against Postgres.
 *
 * HYBRID style (design "Spec Migration Plan"): Arrange stays hand-wired
 * (`TypeOrmOrderRepository` to build fixtures directly against the
 * container-backed DataSource) — there is no HTTP endpoint to build an order
 * with specific item statuses, and adding one is out of scope (proposal
 * non-goal, domain coverage). Act converts to a real HTTP
 * `GET /kitchen-operations/board` request via `bootstrapE2eApp()`, so the
 * query service is reached through the real `KitchenBoardController`, the
 * global `JwtAuthGuard`, and `ClassSerializerInterceptor` — not just the
 * query service directly.
 */
describe('KitchenBoardController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']
  let orderRepository: Repository<OrderEntity>
  let itemRepository: Repository<OrderItemEntity>
  let repository: TypeOrmOrderRepository

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader

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
    await app.close()
  })

  beforeEach(async () => {
    await truncateTables(dataSource, ORDER_TABLES)
  })

  const getBoard = async (stationId?: string): Promise<KitchenBoardOrderGroup[]> => {
    const response = await http()
      .get('/kitchen-operations/board')
      .query(stationId ? { stationId } : {})
      .set(...(await authHeader()))

    expect(response.status).toBe(200)
    return response.body as KitchenBoardOrderGroup[]
  }

  it('produces exactly one board group with items: [] for an OPEN order with zero order_items rows', async () => {
    const order = OrderMother.create({ status: OrderStatus.OPEN, items: [] })
    await repository.save(order)

    const board = await getBoard()
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

    const unfiltered = await getBoard()
    const unfilteredGroup = unfiltered.find(g => g.orderId === order.toPrimitives().id)!
    const unfilteredItemIds = unfilteredGroup.items.map(i => i.itemId).sort()
    expect(unfilteredItemIds).toEqual([sentOnA.id, readyOnA.id, sentOnB.id].sort())

    const filteredByStationA = await getBoard(stationA)
    const groupA = filteredByStationA.find(g => g.orderId === order.toPrimitives().id)!
    const stationAItemIds = groupA.items.map(i => i.itemId).sort()
    expect(stationAItemIds).toEqual([sentOnA.id, readyOnA.id].sort())

    const filteredByStationB = await getBoard(stationB)
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

    const board = await getBoard()
    const group = board.find(g => g.orderId === order.toPrimitives().id)!

    expect(group.items.map(i => i.itemId)).toEqual([sentItem.id])
  })
})
