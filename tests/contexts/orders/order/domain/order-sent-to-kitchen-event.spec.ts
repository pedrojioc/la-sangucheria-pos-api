import {
  OrderSentToKitchenEvent,
  OrderSentToKitchenPayload
} from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('OrderSentToKitchenEvent', () => {
  describe('v3 payload', () => {
    it('should serialize and deserialize with enriched items', () => {
      const orderId = UuidMother.random()
      const ticketId = UuidMother.random()
      const itemId = UuidMother.random()
      const stationId = UuidMother.random()
      const sentAt = new Date()

      const payload: OrderSentToKitchenPayload = {
        orderId,
        orderNumber: '#001',
        ticketId,
        ticketNumber: 1,
        items: [
          {
            itemId,
            stationId,
            productName: 'Choripan',
            quantity: 2,
            notes: 'Extra chimichurri',
            modifiers: [{ name: 'Extra queso', price: 2000 }]
          }
        ],
        sentBy: 'waiter-1',
        sentAt,
        tableId: null,
        tableLabel: null
      }

      const event = new OrderSentToKitchenEvent(payload)
      const primitives = event.toPrimitives()

      expect(primitives.items).toHaveLength(1)
      expect(primitives.items[0].itemId).toBe(itemId)
      expect(primitives.items[0].stationId).toBe(stationId)
      expect(primitives.items[0].productName).toBe('Choripan')
      expect(primitives.items[0].quantity).toBe(2)
      expect(primitives.items[0].notes).toBe('Extra chimichurri')
    })

    it('should have VERSION 3', () => {
      expect(OrderSentToKitchenEvent.VERSION).toBe(3)
    })

    it('should roundtrip through fromPrimitives with tableId and tableLabel', () => {
      const orderId = UuidMother.random()
      const ticketId = UuidMother.random()
      const itemId = UuidMother.random()
      const stationId = UuidMother.random()
      const tableId = UuidMother.random()
      const sentAt = new Date()
      const eventId = UuidMother.random()

      const payload: OrderSentToKitchenPayload = {
        orderId,
        orderNumber: '#002',
        ticketId,
        ticketNumber: 1,
        items: [
          { itemId, stationId, productName: 'Hamburguesa', quantity: 1, notes: null, modifiers: [] }
        ],
        sentBy: 'waiter-1',
        sentAt,
        tableId,
        tableLabel: 'Mesa 5'
      }

      const event = OrderSentToKitchenEvent.fromPrimitives({
        aggregateId: orderId,
        eventId,
        occurredOn: sentAt,
        payload,
        metadata: {},
        version: 3
      })

      const result = event.toPrimitives()
      expect(result.items[0].itemId).toBe(itemId)
      expect(result.items[0].stationId).toBe(stationId)
      expect(result.items[0].productName).toBe('Hamburguesa')
      expect(result.tableId).toBe(tableId)
      expect(result.tableLabel).toBe('Mesa 5')
    })

    it('should default tableId and tableLabel to null when deserializing v2 payload', () => {
      const orderId = UuidMother.random()
      const ticketId = UuidMother.random()
      const itemId = UuidMother.random()
      const sentAt = new Date()

      // v2 payload — no tableId / tableLabel fields
      const v2Payload = {
        orderId,
        orderNumber: '#003',
        ticketId,
        ticketNumber: 1,
        items: [
          {
            itemId,
            stationId: null,
            productName: 'Empanada',
            quantity: 1,
            notes: null,
            modifiers: []
          }
        ],
        sentBy: 'waiter-1',
        sentAt
      }

      const event = OrderSentToKitchenEvent.fromPrimitives({
        aggregateId: orderId,
        eventId: UuidMother.random(),
        occurredOn: sentAt,
        payload: v2Payload,
        metadata: {},
        version: 2
      })

      const result = event.toPrimitives()
      expect(result.tableId).toBeNull()
      expect(result.tableLabel).toBeNull()
    })
  })

  describe('v1 backward compatibility', () => {
    it('should deserialize v1 payload with itemIds into v2 items', () => {
      const orderId = UuidMother.random()
      const ticketId = UuidMother.random()
      const itemId1 = UuidMother.random()
      const itemId2 = UuidMother.random()

      const v1Payload = {
        orderId,
        ticketId,
        ticketNumber: 1,
        itemIds: [itemId1, itemId2],
        sentBy: 'waiter-1',
        sentAt: new Date()
      }

      const event = OrderSentToKitchenEvent.fromPrimitives({
        aggregateId: orderId,
        eventId: UuidMother.random(),
        occurredOn: new Date(),
        payload: v1Payload,
        metadata: {},
        version: 1
      })

      const result = event.toPrimitives()
      expect(result.items).toHaveLength(2)
      expect(result.items[0].itemId).toBe(itemId1)
      expect(result.items[0].stationId).toBeNull()
      expect(result.items[0].productName).toBe('')
      expect(result.items[0].quantity).toBe(0)
      expect(result.items[0].notes).toBeNull()

      expect(result.items[1].itemId).toBe(itemId2)
      expect(result.items[1].stationId).toBeNull()
    })

    it('should preserve orderId and ticketId from v1 payload', () => {
      const orderId = UuidMother.random()
      const ticketId = UuidMother.random()

      const v1Payload = {
        orderId,
        ticketId,
        ticketNumber: 3,
        itemIds: [UuidMother.random()],
        sentBy: 'waiter-2',
        sentAt: new Date()
      }

      const event = OrderSentToKitchenEvent.fromPrimitives({
        aggregateId: orderId,
        eventId: UuidMother.random(),
        occurredOn: new Date(),
        payload: v1Payload,
        metadata: {},
        version: 1
      })

      const result = event.toPrimitives()
      expect(result.orderId).toBe(orderId)
      expect(result.ticketId).toBe(ticketId)
      expect(result.ticketNumber).toBe(3)
      expect(result.sentBy).toBe('waiter-2')
    })
  })
})
