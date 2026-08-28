import { EventRegistry } from '@shared/infrastructure/event-sourcing/event-registry'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { OrderOpenedEvent } from '@contexts/orders/order/domain/events/order-opened.event'

describe('EventRegistry', () => {
  it('rehydrates a registered event type into its DomainEvent instance', () => {
    const registry = new EventRegistry()
    registry.register(OrderClosedEvent)

    const event = registry.rehydrate('order.closed', {
      aggregateId: 'order-1',
      eventId: 'event-1',
      occurredOn: new Date('2026-01-01T00:00:00Z'),
      metadata: {},
      version: 1,
      payload: {
        orderId: 'order-1',
        orderNumber: '1',
        tableId: 'table-1',
        subtotal: 10,
        discountTotal: 0,
        taxBase: 10,
        taxAmount: 0,
        taxConfig: { type: 'none', rate: 0, inclusive: false },
        items: [],
        closedAt: new Date('2026-01-01T00:00:00Z'),
        currency: 'PEN'
      }
    })

    expect(event).toBeInstanceOf(OrderClosedEvent)
    expect(event.aggregateId).toBe('order-1')
  })

  it('rehydrates a different registered event type into its own class (triangulation)', () => {
    const registry = new EventRegistry()
    registry.register(OrderOpenedEvent)

    const event = registry.rehydrate('order.opened', {
      aggregateId: 'order-2',
      eventId: 'event-2',
      occurredOn: new Date('2026-01-02T00:00:00Z'),
      metadata: {},
      version: 1,
      payload: { orderId: 'order-2', tableId: 'table-2' }
    })

    expect(event).toBeInstanceOf(OrderOpenedEvent)
    expect(event.aggregateId).toBe('order-2')
  })

  it('throws when asked to rehydrate an unregistered event type', () => {
    const registry = new EventRegistry()

    expect(() =>
      registry.rehydrate('unknown.event', {
        aggregateId: 'x',
        eventId: 'y',
        occurredOn: new Date(),
        metadata: {},
        version: 1,
        payload: {}
      })
    ).toThrow('unknown.event')
  })
})
