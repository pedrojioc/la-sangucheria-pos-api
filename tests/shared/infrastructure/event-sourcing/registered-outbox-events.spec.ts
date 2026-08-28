import { REGISTERED_OUTBOX_EVENTS } from '@shared/infrastructure/event-sourcing/registered-outbox-events'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { EventRegistry } from '@shared/infrastructure/event-sourcing/event-registry'

describe('REGISTERED_OUTBOX_EVENTS', () => {
  it('contains exactly the event classes with a registered category-2 subscriber today', () => {
    expect(REGISTERED_OUTBOX_EVENTS).toEqual(
      expect.arrayContaining([OrderClosedEvent, OrderSentToKitchenEvent])
    )
    expect(REGISTERED_OUTBOX_EVENTS).toHaveLength(2)
  })

  it('every listed class is directly registrable into EventRegistry (rehydrate resolves, no throw)', () => {
    const registry = new EventRegistry()
    registry.registerMany(REGISTERED_OUTBOX_EVENTS)

    expect(() =>
      registry.rehydrate('order.closed', {
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
    ).not.toThrow()
  })
})
