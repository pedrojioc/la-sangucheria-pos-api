import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderItemDeliveredEvent } from '@contexts/orders/order/domain/events/order-item-delivered.event'
import { OrderReadyEvent } from '@contexts/orders/order/domain/events/order-ready.event'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('Order - markItemDelivered', () => {
  describe('when the last active item is delivered', () => {
    it('should transition status to READY', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.delivered(), OrderItemMother.ready({ id: readyItemId })]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      expect(order.getStatus()).toBe(OrderStatus.READY)
    })

    it('should record an OrderReadyEvent', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.delivered(), OrderItemMother.ready({ id: readyItemId })]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const events = order.pullDomainEvents()
      const readyEvents = events.filter(e => e instanceof OrderReadyEvent)
      expect(readyEvents).toHaveLength(1)
      expect(readyEvents[0].eventName).toBe('order.ready')

      const payload = readyEvents[0].toPrimitives()
      expect(payload.orderId).toBe(order.toPrimitives().id)
      expect(payload.orderNumber).toBe(order.toPrimitives().orderNumber)
      expect(payload.tableId).toBe(order.toPrimitives().tableId)
      expect(payload.readyAt).toBeInstanceOf(Date)
    })

    it('should NOT record an OrderClosedEvent', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.delivered(), OrderItemMother.ready({ id: readyItemId })]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const events = order.pullDomainEvents()
      const closedEvents = events.filter(e => e instanceof OrderClosedEvent)
      expect(closedEvents).toHaveLength(0)
    })

    it('should NOT set closedBy or closedAt', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.delivered(), OrderItemMother.ready({ id: readyItemId })]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const primitives = order.toPrimitives()
      expect(primitives.closedBy).toBeNull()
      expect(primitives.closedAt).toBeNull()
    })

    it('should still record an OrderItemDeliveredEvent with orderAutoCompleted true', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.delivered(), OrderItemMother.ready({ id: readyItemId })]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const events = order.pullDomainEvents()
      const deliveredEvents = events.filter(e => e instanceof OrderItemDeliveredEvent)
      expect(deliveredEvents).toHaveLength(1)
      expect(deliveredEvents[0].toPrimitives().orderAutoCompleted).toBe(true)
    })
  })

  describe('when a non-final item is delivered', () => {
    it('should keep status as IN_PROGRESS', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [
          OrderItemMother.ready({ id: readyItemId }),
          OrderItemMother.ready(),
          OrderItemMother.sent()
        ]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      expect(order.getStatus()).toBe(OrderStatus.IN_PROGRESS)
    })

    it('should NOT record an OrderReadyEvent', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.ready({ id: readyItemId }), OrderItemMother.ready()]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const events = order.pullDomainEvents()
      const readyEvents = events.filter(e => e instanceof OrderReadyEvent)
      expect(readyEvents).toHaveLength(0)
    })

    it('should NOT record an OrderClosedEvent', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.ready({ id: readyItemId }), OrderItemMother.sent()]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      const events = order.pullDomainEvents()
      const closedEvents = events.filter(e => e instanceof OrderClosedEvent)
      expect(closedEvents).toHaveLength(0)
    })
  })

  describe('when cancelled items exist alongside active items', () => {
    it('should consider only active items for auto-completion', () => {
      const readyItemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.IN_PROGRESS,
        items: [OrderItemMother.ready({ id: readyItemId }), OrderItemMother.cancelled()]
      })

      order.pullDomainEvents()
      order.markItemDelivered(readyItemId, UuidMother.random())

      expect(order.getStatus()).toBe(OrderStatus.READY)

      const events = order.pullDomainEvents()
      const readyEvents = events.filter(e => e instanceof OrderReadyEvent)
      expect(readyEvents).toHaveLength(1)

      const closedEvents = events.filter(e => e instanceof OrderClosedEvent)
      expect(closedEvents).toHaveLength(0)
    })
  })
})

describe('Order - close', () => {
  it('should record an OrderClosedEvent with payment data', () => {
    const order = OrderMother.readyToClose()

    order.pullDomainEvents()
    order.close([{ method: 'CASH', amount: order.toPrimitives().total }], 'cashier-1')

    const events = order.pullDomainEvents()
    const closedEvents = events.filter(e => e instanceof OrderClosedEvent)
    expect(closedEvents).toHaveLength(1)

    const payload = closedEvents[0].toPrimitives()
    expect(payload.closedBy).toBe('cashier-1')
    expect(payload.payments).not.toBeNull()
    expect(payload.payments).toHaveLength(1)
    expect(payload.closedAt).toBeInstanceOf(Date)
  })

  it('should set closedBy and closedAt on the aggregate', () => {
    const order = OrderMother.readyToClose()

    order.close([{ method: 'CARD', amount: order.toPrimitives().total }], 'cashier-2')

    const primitives = order.toPrimitives()
    expect(primitives.closedBy).toBe('cashier-2')
    expect(primitives.closedAt).toBeInstanceOf(Date)
    expect(primitives.status).toBe(OrderStatus.CLOSED)
  })

  it('should transition status to CLOSED', () => {
    const order = OrderMother.readyToClose()

    order.close([{ method: 'CASH', amount: order.toPrimitives().total }], 'cashier-1')

    expect(order.getStatus()).toBe(OrderStatus.CLOSED)
  })
})
