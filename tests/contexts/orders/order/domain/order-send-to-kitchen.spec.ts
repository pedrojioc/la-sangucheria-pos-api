import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import {
  OrderSentToKitchenEvent,
  SentToKitchenItem
} from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderHasNoPendingItems } from '@contexts/orders/order/domain/exceptions/order-has-no-pending-items.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('Order - sendToKitchen', () => {
  describe('v2 event enrichment', () => {
    it('should emit OrderSentToKitchenEvent with enriched items', () => {
      const itemId = UuidMother.random()
      const productId = UuidMother.random()
      const stationId = UuidMother.random()
      const order = OrderMother.create({
        items: [
          OrderItemMother.pending({
            id: itemId,
            productId,
            productName: 'Choripan',
            quantity: 2,
            notes: 'Extra chimichurri'
          })
        ]
      })

      const stationAssignments = new Map<string, string | null>([[productId, stationId]])

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random(), stationAssignments)

      const events = order.pullDomainEvents()
      const sentEvents = events.filter(e => e instanceof OrderSentToKitchenEvent)
      expect(sentEvents).toHaveLength(1)

      const payload = sentEvents[0].toPrimitives()
      expect(payload.items).toHaveLength(1)

      const item = payload.items[0]
      expect(item.itemId).toBe(itemId)
      expect(item.stationId).toBe(stationId)
      expect(item.productName).toBe('Choripan')
      expect(item.quantity).toBe(2)
      expect(item.notes).toBe('Extra chimichurri')
    })

    it('should set stationId to null for items without station mapping', () => {
      const itemId = UuidMother.random()
      const productId = UuidMother.random()
      const order = OrderMother.create({
        items: [
          OrderItemMother.pending({
            id: itemId,
            productId,
            productName: 'Bebida'
          })
        ]
      })

      const stationAssignments = new Map<string, string | null>([[productId, null]])

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random(), stationAssignments)

      const events = order.pullDomainEvents()
      const sentEvents = events.filter(e => e instanceof OrderSentToKitchenEvent)
      const payload = sentEvents[0].toPrimitives()

      expect(payload.items[0].stationId).toBeNull()
    })

    it('should handle multiple items with different stations', () => {
      const item1Id = UuidMother.random()
      const item2Id = UuidMother.random()
      const product1Id = UuidMother.random()
      const product2Id = UuidMother.random()
      const station1Id = UuidMother.random()
      const station2Id = UuidMother.random()

      const order = OrderMother.create({
        items: [
          OrderItemMother.pending({
            id: item1Id,
            productId: product1Id,
            productName: 'Hamburguesa'
          }),
          OrderItemMother.pending({
            id: item2Id,
            productId: product2Id,
            productName: 'Papas fritas'
          })
        ]
      })

      const stationAssignments = new Map<string, string | null>([
        [product1Id, station1Id],
        [product2Id, station2Id]
      ])

      order.pullDomainEvents()
      order.sendToKitchen(
        UuidMother.random(),
        [item1Id, item2Id],
        UuidMother.random(),
        stationAssignments
      )

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()

      expect(payload.items).toHaveLength(2)
      expect(payload.items.find((i: SentToKitchenItem) => i.itemId === item1Id)!.stationId).toBe(
        station1Id
      )
      expect(payload.items.find((i: SentToKitchenItem) => i.itemId === item2Id)!.stationId).toBe(
        station2Id
      )
    })

    it('should default stationId to null when no stationAssignments provided', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        items: [OrderItemMother.pending({ id: itemId, productName: 'Empanada' })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random())

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()

      expect(payload.items[0].stationId).toBeNull()
      expect(payload.items[0].productName).toBe('Empanada')
    })

    it('should transition order status to IN_PROGRESS', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random())

      expect(order.getStatus()).toBe(OrderStatus.IN_PROGRESS)
    })

    it('should throw OrderHasNoPendingItems when no pending items match', () => {
      const order = OrderMother.create({
        items: [OrderItemMother.sent()]
      })

      expect(() =>
        order.sendToKitchen(UuidMother.random(), [UuidMother.random()], UuidMother.random())
      ).toThrow(OrderHasNoPendingItems)
    })

    it('should set event VERSION to 4', () => {
      expect(OrderSentToKitchenEvent.VERSION).toBe(4)
    })

    it('should include tableId and tableLabel in event payload when provided', () => {
      const itemId = UuidMother.random()
      const tableId = UuidMother.random()
      const order = OrderMother.create({
        tableId,
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(
        UuidMother.random(),
        [itemId],
        UuidMother.random(),
        new Map(),
        tableId,
        'Mesa 3'
      )

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()
      expect(payload.tableId).toBe(tableId)
      expect(payload.tableLabel).toBe('Mesa 3')
    })

    it('should set tableId and tableLabel to null for takeaway orders', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        tableId: null,
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random(), new Map(), null, null)

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()
      expect(payload.tableId).toBeNull()
      expect(payload.tableLabel).toBeNull()
    })
  })

  describe('orderType enrichment', () => {
    it('should include DINE_IN orderType in event payload', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        type: OrderType.DINE_IN,
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random())

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()
      expect(payload.orderType).toBe(OrderType.DINE_IN)
    })

    it('should include TAKEOUT orderType in event payload and keep table fields null', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        type: OrderType.TAKEOUT,
        tableId: null,
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random())

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()
      expect(payload.orderType).toBe(OrderType.TAKEOUT)
      expect(payload.tableId).toBeNull()
      expect(payload.tableLabel).toBeNull()
    })

    it('should include DELIVERY orderType in event payload', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        type: OrderType.DELIVERY,
        items: [OrderItemMother.pending({ id: itemId })]
      })

      order.pullDomainEvents()
      order.sendToKitchen(UuidMother.random(), [itemId], UuidMother.random())

      const events = order.pullDomainEvents()
      const payload = events.find(e => e instanceof OrderSentToKitchenEvent)!.toPrimitives()
      expect(payload.orderType).toBe(OrderType.DELIVERY)
    })
  })
})
