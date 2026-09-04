import { DataSource } from 'typeorm'
import { INestApplication } from '@nestjs/common'

import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderMother } from '@test/contexts/orders/order/__mothers__/order.mother'
import { OrderItemMother } from '@test/contexts/orders/order/__mothers__/order-item.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { truncateTables, ORDER_TABLES } from './support/truncate'

/**
 * HTTP-response shape for `GET /kitchen-operations/board`. Mirrors
 * `KitchenBoardOrderGroup` field-for-field EXCEPT the date fields, which
 * travel as ISO strings over real HTTP+JSON (there is no `Date` instance on
 * the wire) — casting the raw response body to the domain DTO type here
 * would silently lie about the runtime shape (finding #2).
 */
interface KitchenBoardItemHttpResponse {
  id: string
  itemId: string
  itemName: string
  stationId: string | null
  status: string
  quantity: number
  notes: string | null
  modifiers: Record<string, unknown>[]
  sentAt: string
  readyAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}

interface KitchenBoardOrderGroupHttpResponse {
  orderId: string
  orderNumber: string
  orderStatus: string
  tableId: string | null
  tableLabel: string | null
  oldestSentAt: string
  items: KitchenBoardItemHttpResponse[]
}

/**
 * Real-Postgres coverage for the kitchen board read path, closing the gap
 * left by tests/e2e/ not existing (design decision 4). The mocked
 * QueryBuilder unit tests can assert *call arguments* but cannot faithfully
 * simulate LEFT JOIN / ON-clause semantics — this suite executes the actual
 * SQL against Postgres.
 *
 * HYBRID style (design "Spec Migration Plan"): Arrange stays hand-wired
 * (`OrderRepository`, resolved from the app's own DI container, to build
 * fixtures directly against the container-backed DataSource) — there is no
 * HTTP endpoint to build an order with specific item statuses, and adding
 * one is out of scope (proposal non-goal, domain coverage). Act converts to
 * a real HTTP
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
  let repository: OrderRepository

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader

    // Resolved from the same Nest DI container `bootstrapE2eApp()` already
    // built, instead of hand-constructing a second, independently-wired
    // `TypeOrmOrderRepository` — the Arrange step must exercise the exact
    // repository wiring the app under test actually uses (finding #4).
    repository = app.get(OrderRepository)
  })

  afterAll(async () => {
    // Leave the shared, container-backed database as clean as beforeEach
    // would — without this, the last test's rows survive until whichever
    // spec file Jest schedules next (`--runInBand`, one shared Postgres
    // across the whole e2e run) truncates them itself (finding #1).
    await truncateTables(dataSource, ORDER_TABLES)
    await app.close()
  })

  beforeEach(async () => {
    await truncateTables(dataSource, ORDER_TABLES)
  })

  const getBoard = async (stationId?: string): Promise<KitchenBoardOrderGroupHttpResponse[]> => {
    const response = await http()
      .get('/kitchen-operations/board')
      .query(stationId ? { stationId } : {})
      .set(...(await authHeader()))

    expect(response.status).toBe(200)
    return response.body as KitchenBoardOrderGroupHttpResponse[]
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
