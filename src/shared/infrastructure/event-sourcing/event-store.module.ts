import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventStoreEntity } from './persistence/event-store.entity'
import { EventStoreService } from './event-store.service'
import { EventRegistry } from './event-registry'
import { REGISTERED_OUTBOX_EVENTS } from './registered-outbox-events'

/**
 * EventRegistry provider factory (Slice 9).
 *
 * A fresh EventRegistry instance, pre-populated with every DomainEventClass
 * that has a registered category-2 subscriber (registered-outbox-events.ts)
 * — used by OutboxPollerService to rehydrate a claimed event_store row back
 * into a real DomainEvent before dispatching it.
 *
 * NOTE: OutboxPollerService itself is NOT registered here. It needs both
 * EventStoreService (this module) AND EventBusRouter (InMemoryEventBusModule)
 * — importing either module into the other to satisfy that would create a
 * circular module dependency. Instead it's registered one level up, in
 * SharedInfrastructureModule, which already imports both as siblings.
 */
const eventRegistryProvider = {
  provide: EventRegistry,
  useFactory: (): EventRegistry => {
    const registry = new EventRegistry()
    registry.registerMany(REGISTERED_OUTBOX_EVENTS)
    return registry
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([EventStoreEntity])],
  providers: [EventStoreService, eventRegistryProvider],
  exports: [EventStoreService, EventRegistry]
})
export class EventStoreModule {}
