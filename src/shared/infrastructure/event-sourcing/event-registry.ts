import {
  DomainEvent,
  DomainEventClass,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

/**
 * EventRegistry
 *
 * Maps an event's EVENT_NAME (stored as event_store.event_type) back to its
 * concrete DomainEventClass so category-2 rows can be rehydrated into real
 * DomainEvent instances — needed by the outbox poller (Slice 9) to dispatch
 * deferred subscribers with a real, typed event instead of the raw row.
 *
 * No such registry existed anywhere in the codebase prior to this task
 * (verified via grep for a fromPrimitives-keyed map) — built fresh here.
 */
export class EventRegistry {
  private readonly classesByEventName = new Map<string, DomainEventClass>()

  register(eventClass: DomainEventClass): void {
    this.classesByEventName.set(eventClass.EVENT_NAME, eventClass)
  }

  registerMany(eventClasses: DomainEventClass[]): void {
    eventClasses.forEach(eventClass => this.register(eventClass))
  }

  rehydrate(eventType: string, params: DomainEventFromPrimitivesParams): DomainEvent {
    const eventClass = this.classesByEventName.get(eventType)

    if (!eventClass) {
      throw new Error(`EventRegistry: no DomainEventClass registered for event type "${eventType}"`)
    }

    return eventClass.fromPrimitives(params)
  }
}
