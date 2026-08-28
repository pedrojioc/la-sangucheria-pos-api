import { DomainEventClass } from '@shared/domain/events'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'

/**
 * REGISTERED_OUTBOX_EVENTS
 *
 * DomainEventClass list registered into EventRegistry (Slice 9) so
 * OutboxPollerService can rehydrate a claimed event_store row back into a
 * real DomainEvent instance before dispatching it to its category-2
 * subscriber(s).
 *
 * Scoped to the event types that ACTUALLY have a category-2 (Deferred)
 * subscriber registered in dispatch-category.registry.ts today —
 * OrderClosedEvent (IssueBillingDocumentOnOrderClosed) and
 * OrderSentToKitchenEvent (PrintKitchenTicketOnOrderSent). Registering every
 * DomainEvent class in the codebase here would be dead weight: an event
 * with no category-2 subscriber is never claimed as "needs rehydration" by
 * the poller in any meaningful sense — deferredSubscribersFor() would
 * return an empty array regardless. Add an event class here only when a
 * new category-2 subscriber is registered for it in
 * dispatch-category.registry.ts.
 */
export const REGISTERED_OUTBOX_EVENTS: DomainEventClass[] = [
  OrderClosedEvent as unknown as DomainEventClass,
  OrderSentToKitchenEvent as unknown as DomainEventClass
]
