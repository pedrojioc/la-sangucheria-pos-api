import { TypeOrmKitchenBoardQueryService } from '@contexts/kitchen-operations/kitchen-board/infrastructure/query-services/typeorm-kitchen-board-query.service'
import { Repository } from 'typeorm'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'

/**
 * These tests exercise the query-builder chain via a mocked
 * `Repository<OrderEntity>`, asserting the SQL fragments/params passed to
 * TypeORM rather than executing against a real database. Full round-trip
 * verification (actual JOIN results, ordering, grouping against real rows)
 * requires PostgreSQL — this project's unit jest project runs on
 * better-sqlite3, which cannot execute raw JOIN/subquery SQL the way this
 * service needs. Same convention as
 * `tests/contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository.spec.ts`
 * (describe.skip block) and `TypeOrmPurchaseOrderRepository.spec.ts`.
 */
describe('TypeOrmKitchenBoardQueryService', () => {
  let service: TypeOrmKitchenBoardQueryService
  let repository: jest.Mocked<Repository<OrderEntity>>
  let queryBuilder: {
    leftJoin: jest.Mock
    where: jest.Mock
    select: jest.Mock
    orderBy: jest.Mock
    addOrderBy: jest.Mock
    getRawMany: jest.Mock
  }

  beforeEach(() => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([])
    }

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    } as unknown as jest.Mocked<Repository<OrderEntity>>

    service = new TypeOrmKitchenBoardQueryService(repository)
  })

  it('should query directly against orders (no KitchenBoardItemEntity repository)', async () => {
    await service.findActiveByStation()

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('o')
  })

  it('should place the station predicate in the order_items JOIN ON clause, not WHERE', async () => {
    await service.findActiveByStation('station-1')

    const joinCall = queryBuilder.leftJoin.mock.calls.find(
      (call: unknown[]) => call[0] === 'order_items'
    )
    expect(joinCall).toBeDefined()
    expect(joinCall![2]).toContain('station_id')
    expect(joinCall![3]).toMatchObject({ stationId: 'station-1' })

    for (const whereCall of queryBuilder.where.mock.calls) {
      expect(String(whereCall[0])).not.toContain('station_id')
    }
  })

  it('should map a row with null item columns to an order group with items: []', async () => {
    const openedAt = new Date('2026-01-01T10:00:00Z')
    queryBuilder.getRawMany.mockResolvedValue([
      {
        orderId: 'order-1',
        orderNumber: 'ORD-1',
        orderStatus: 'OPEN',
        tableId: null,
        tableLabel: null,
        openedAt,
        itemId: null,
        itemName: null,
        stationId: null,
        itemStatus: null,
        quantity: null,
        notes: null,
        modifiers: null,
        sentAt: null,
        readyAt: null,
        deliveredAt: null,
        cancelledAt: null
      }
    ])

    const result = await service.findActiveByStation()

    expect(result).toHaveLength(1)
    expect(result[0].orderId).toBe('order-1')
    expect(result[0].items).toEqual([])
    expect(result[0].oldestSentAt).toEqual(openedAt)
  })

  it('should map a row with item columns into a real item, using sentAt for oldestSentAt', async () => {
    const openedAt = new Date('2026-01-01T10:00:00Z')
    const sentAt = new Date('2026-01-01T10:05:00Z')
    queryBuilder.getRawMany.mockResolvedValue([
      {
        orderId: 'order-1',
        orderNumber: 'ORD-1',
        orderStatus: 'IN_PROGRESS',
        tableId: 'table-1',
        tableLabel: '5',
        openedAt,
        itemId: 'item-1',
        itemName: 'Choripan',
        stationId: 'station-1',
        itemStatus: 'SENT',
        quantity: 2,
        notes: null,
        modifiers: [],
        sentAt,
        readyAt: null,
        deliveredAt: null,
        cancelledAt: null
      }
    ])

    const result = await service.findActiveByStation()

    expect(result[0].items).toHaveLength(1)
    expect(result[0].items[0].itemId).toBe('item-1')
    expect(result[0].oldestSentAt).toEqual(sentAt)
  })
})
