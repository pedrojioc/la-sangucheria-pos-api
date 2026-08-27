import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderId } from '@contexts/orders/order/domain/order-id'
import { OrderItemsNotLoaded } from '@contexts/orders/order/domain/exceptions/order-items-not-loaded.exception'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * TypeOrmOrderRepository mapping unit tests
 *
 * These are pure mapping tests (hand-built entities, no DB) — they cover the
 * `toDomain()` guard against silently dropping items when the relation was
 * not loaded (design decision 3). Full transactional save()/query integration
 * tests require a real PostgreSQL instance (jsonb + relations are not
 * supported by better-sqlite3) and live in tests/e2e/.
 */
describe('TypeOrmOrderRepository', () => {
  const baseEntity = (): OrderEntity => {
    const entity = new OrderEntity()
    entity.id = UuidMother.random()
    entity.orderNumber = 'ORD-001'
    entity.type = OrderType.DINE_IN
    entity.status = OrderStatus.OPEN
    entity.tableId = null
    entity.customerId = null
    entity.addressId = null
    entity.deliveryFee = null
    entity.currency = 'COP'
    entity.kitchenTickets = []
    entity.payments = null
    entity.splits = null
    entity.taxConfig = { rate: 0.08, type: 'INC', inclusive: true } as never
    entity.orderDiscount = null
    entity.subtotal = 0 as never
    entity.discountTotal = 0 as never
    entity.taxBase = 0 as never
    entity.taxAmount = 0 as never
    entity.total = 0 as never
    entity.tip = null
    entity.notes = null
    entity.openedBy = UuidMother.random()
    entity.openedAt = new Date()
    entity.closedBy = null
    entity.closedAt = null
    entity.cancelledBy = null
    entity.cancelledAt = null
    entity.cancelledReason = null
    return entity
  }

  const buildRepository = (findOneResult: OrderEntity | null) => {
    const repositoryMock = {
      findOne: jest.fn().mockResolvedValue(findOneResult)
    }
    const itemRepositoryMock = {}
    const dataSourceMock = {}
    return new TypeOrmOrderRepository(
      repositoryMock as never,
      itemRepositoryMock as never,
      dataSourceMock as never
    )
  }

  describe('search -> toDomain mapping', () => {
    it('throws OrderItemsNotLoaded when the items relation was not loaded', async () => {
      const entity = baseEntity()
      // items intentionally left undefined — simulates a query that forgot the relation
      entity.items = undefined as never

      const repository = buildRepository(entity)

      await expect(repository.search(new OrderId(entity.id))).rejects.toThrow(OrderItemsNotLoaded)
    })

    it('returns an order with an empty items array when the relation loaded zero rows', async () => {
      const entity = baseEntity()
      entity.items = []

      const repository = buildRepository(entity)

      const order = await repository.search(new OrderId(entity.id))

      expect(order).not.toBeNull()
      expect(order!.toPrimitives().items).toEqual([])
    })

    it('returns null when no order matches the id', async () => {
      const repository = buildRepository(null)

      const order = await repository.search(new OrderId(UuidMother.random()))

      expect(order).toBeNull()
    })
  })
})

/**
 * TypeOrmOrderRepository transactional integration tests
 *
 * NOTE: This suite requires a running PostgreSQL instance because:
 * - OrderItemEntity relies on jsonb sub-columns (modifiers, discount) and a
 *   real foreign key to `orders`
 * - better-sqlite3 does not support jsonb columns or TypeORM relations
 *   the way PostgreSQL does
 *
 * Coverage for transactional replace-children semantics (design decisions 1
 * and 2) now lives in real-Postgres e2e suites, not here:
 * - tests/e2e/order-repository.e2e-spec.ts — save() replace-children
 *   delete-on-removal, UPDATE-not-delete on cancel, search()/
 *   searchWithActiveKitchenItems() round trips
 * - tests/e2e/kitchen-board-query.e2e-spec.ts — LEFT JOIN placeholder parity
 *   and station/status join predicate (design decision 4)
 *
 * Run with: pnpm test:e2e (requires a locally running Postgres, see
 * tests/e2e/support/e2e-data-source.ts for the connection convention).
 */
