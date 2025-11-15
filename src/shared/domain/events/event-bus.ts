import { DomainEvent } from './domain-event'
import { DomainEventSubscriber } from './domain-event-subscriber'

export abstract class EventBus {
  abstract publish(events: DomainEvent[]): Promise<void>
  abstract addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void
}
