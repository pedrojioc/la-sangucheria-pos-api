import { Inject, Module, OnModuleInit } from '@nestjs/common'
import { EventBusRouter } from '../event-bus.router'
import {
  DOMAIN_SUBSCRIBERS,
  IN_MEMORY_EVENT_SUBSCRIBERS,
  DomainSubscribersArray
} from '../providers/event-bus.tokens'
import { EventBus } from '@/shared/domain/events'
import { EventStoreModule } from '@/shared/infrastructure/event-sourcing/event-store.module'

/**
 * InMemoryEventBusModule
 *
 * Wires EventBusRouter as the EventBus implementation (design D7/D8 —
 * replaces the deleted InMemoryNestEventBus). EventEmitterModule / EventEmitter2
 * are dropped entirely: the router dispatches category-1 subscribers via direct
 * invocation, not an event emitter, so the `wildcard: false` root cause
 * that made the old PersistDomainEventsSubscriber inert no longer exists —
 * both files were deleted (Slice 4), not reconfigured.
 */
@Module({
  imports: [EventStoreModule],
  providers: [
    ...DOMAIN_SUBSCRIBERS,
    {
      provide: IN_MEMORY_EVENT_SUBSCRIBERS,
      useFactory: (...subscribers): DomainSubscribersArray => subscribers,
      inject: [...DOMAIN_SUBSCRIBERS]
    },
    EventBusRouter,
    {
      provide: EventBus,
      useExisting: EventBusRouter
    }
  ],
  exports: [EventBus, EventBusRouter, IN_MEMORY_EVENT_SUBSCRIBERS]
})
export class InMemoryEventBusModule implements OnModuleInit {
  constructor(
    private readonly eventBusRouter: EventBusRouter,
    @Inject(IN_MEMORY_EVENT_SUBSCRIBERS)
    private readonly subscribers: DomainSubscribersArray
  ) {}

  onModuleInit(): void {
    this.eventBusRouter.addSubscribers(this.subscribers)
  }
}
