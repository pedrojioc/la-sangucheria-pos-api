import { Order } from '@contexts/orders/order/domain/order'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { TaxType } from '@contexts/orders/order/domain/tax-type'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { DomainEvent } from '@shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('Order.close() — enriched OrderClosedEvent payload', () => {
  /**
   * Order: 2 active items, 19% inclusive IVA, no discounts.
   * Item 1: unitPrice=10000, qty=1 → lineTotal=10000
   * Item 2: unitPrice=15000, qty=2 → lineTotal=30000
   * subtotal = 40000 (no discounts)
   * netTotalAfterDiscounts = 40000
   * taxBase = 40000 / 1.19 ≈ 33613.45
   * taxAmount = 40000 - 33613.45 = 6386.55
   * total = 40000
   */
  function buildOrderWithTwoItems(): Order {
    return OrderMother.create({
      status: OrderStatus.IN_PROGRESS,
      taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
      items: [
        OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' }),
        OrderItemMother.ready({ unitPrice: 15000, quantity: 2, currency: 'COP' })
      ]
    })
  }

  describe('Scenario: Event carries fiscal payload (REQ-2)', () => {
    it('should include subtotal, taxBase, taxAmount, discountTotal, taxConfig and items in payload', () => {
      // Arrange
      const order = buildOrderWithTwoItems()
      const payments = [{ method: 'CASH' as const, amount: 40000 }]

      // Act
      order.close(payments, UuidMother.random())
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert — fiscal totals
      expect(payload.subtotal).toBeCloseTo(40000, 2)
      expect(payload.discountTotal).toBeCloseTo(0, 2)
      expect(payload.taxBase).toBeCloseTo(33613.45, 2)
      expect(payload.taxAmount).toBeCloseTo(6386.55, 2)
      expect(payload.total).toBeCloseTo(40000, 2)

      // Assert — taxConfig
      expect(payload.taxConfig).toEqual({
        rate: 0.19,
        type: TaxType.IVA,
        inclusive: true
      })

      // Assert — items (only active ones)
      expect(payload.items).toHaveLength(2)
      const item1 = payload.items[0]
      expect(item1.unitPrice).toBe(10000)
      expect(item1.quantity).toBe(1)
      expect(item1.lineTotal).toBe(10000)

      const item2 = payload.items[1]
      expect(item2.unitPrice).toBe(15000)
      expect(item2.quantity).toBe(2)
      expect(item2.lineTotal).toBe(30000)
    })

    it('should distribute per-item taxAmount proportionally (sum approximates total taxAmount)', () => {
      // Arrange
      const order = buildOrderWithTwoItems()
      const payments = [{ method: 'CASH' as const, amount: 40000 }]

      // Act
      order.close(payments, UuidMother.random())
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert — proportional tax:
      // Item 1: 10000 / 40000 * 6386.55 ≈ 1596.64
      // Item 2: 30000 / 40000 * 6386.55 ≈ 4789.91
      // Due to rounding, the sum may differ by a few cents from total taxAmount
      const sumOfItemTax = payload.items.reduce((sum, i) => sum + i.taxAmount, 0)
      expect(sumOfItemTax).toBeCloseTo(payload.taxAmount, 0)
    })

    it('should compute per-item taxAmount as 0 for an item with zero lineTotal when there is a non-zero sibling', () => {
      // Arrange — one item with unitPrice=0, one with unitPrice=10000
      // Zero-lineTotal item contributes 0 proportional tax even though total > 0
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [
          OrderItemMother.ready({ unitPrice: 0, quantity: 1, currency: 'COP' }),
          OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })
        ]
      })
      // total = 10000 (the zero-price item adds nothing)
      const payments = [{ method: 'CASH' as const, amount: 10000 }]

      // Act
      order.close(payments, UuidMother.random())
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert — zero-lineTotal item gets 0 proportional tax; non-zero item gets all the tax
      expect(payload.items[0].taxAmount).toBe(0) // unitPrice=0 → proportional = 0
      expect(payload.items[1].taxAmount).toBeGreaterThan(0)
    })

    it('should exclude cancelled items from the items array', () => {
      // Arrange — one active, one cancelled
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [
          OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' }),
          OrderItemMother.cancelled({ unitPrice: 20000, quantity: 1, currency: 'COP' })
        ]
      })
      const payments = [{ method: 'CASH' as const, amount: 10000 }]

      // Act
      order.close(payments, UuidMother.random())
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert — only the active item appears
      expect(payload.items).toHaveLength(1)
      expect(payload.items[0].unitPrice).toBe(10000)
    })
  })

  describe('Scenario: Named-invoice fields forwarded (REQ-2)', () => {
    it('should include customerDocumentType and customerDocumentNumber when passed', () => {
      // Arrange
      const order = buildOrderWithTwoItems()
      const payments = [{ method: 'CASH' as const, amount: 40000 }]

      // Act
      order.close(payments, UuidMother.random(), null, null, 'NIT', '900123456')
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert
      expect(payload.customerDocumentType).toBe('NIT')
      expect(payload.customerDocumentNumber).toBe('900123456')
    })
  })

  describe('Scenario: Consumidor Final path (REQ-2)', () => {
    it('should set customerDocumentType and customerDocumentNumber to null when params are absent', () => {
      // Arrange
      const order = buildOrderWithTwoItems()
      const payments = [{ method: 'CASH' as const, amount: 40000 }]

      // Act — no customer document params
      order.close(payments, UuidMother.random())
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert
      expect(payload.customerDocumentType).toBeNull()
      expect(payload.customerDocumentNumber).toBeNull()
    })
  })

  describe('VERSION bump', () => {
    it('should have VERSION set to 2', () => {
      expect(OrderClosedEvent.VERSION).toBe(2)
    })
  })

  describe('Existing subscriber fields remain intact (additive check)', () => {
    it('should still include orderId, tableId, customerId, total, currency, payments, closedBy, closedAt', () => {
      // Arrange
      const tableId = UuidMother.random()
      const customerId = UuidMother.random()
      const closedBy = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        tableId,
        customerId,
        taxConfig: { rate: 0.19, type: TaxType.IVA, inclusive: true },
        items: [OrderItemMother.ready({ unitPrice: 10000, quantity: 1, currency: 'COP' })]
      })

      // Act
      order.close([{ method: 'CASH', amount: 10000 }], closedBy)
      const events = order.pullDomainEvents()
      const closedEvent = events.find(
        (e: DomainEvent) => e instanceof OrderClosedEvent
      ) as OrderClosedEvent
      const payload = closedEvent.toPrimitives()

      // Assert — original fields untouched
      expect(payload.tableId).toBe(tableId)
      expect(payload.customerId).toBe(customerId)
      expect(payload.closedBy).toBe(closedBy)
      expect(payload.total).toBeCloseTo(10000, 2)
      expect(payload.currency).toBe('COP')
      expect(payload.payments).toHaveLength(1)
      expect(payload.closedAt).toBeInstanceOf(Date)
    })
  })
})
