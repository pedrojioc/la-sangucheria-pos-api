import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ScheduleModule } from '@nestjs/schedule'
import { InMemoryEventBusModule } from './event-bus/in-memory/in-memory-event-bus.module'
import { EventStoreModule } from './event-sourcing/event-store.module'
import { OutboxPollerService } from './event-sourcing/outbox-poller.service'
import { FileStorageModule } from './storage/file-storage.module'
import { UnitOfWorkModule } from './unit-of-work/unit-of-work.module'
import { UnitConversionsModule } from '@/contexts/shared-kernel/unit-conversion/unit-conversion.module'

/**
 * OutboxPollerService (Slice 9, design D3) is registered HERE rather than in
 * EventStoreModule or InMemoryEventBusModule: it depends on EventStoreService
 * (EventStoreModule) AND EventBusRouter (InMemoryEventBusModule), and those
 * two modules do not import each other. Registering the poller in this
 * shared parent — which already imports both as siblings — resolves both
 * dependencies without introducing a circular module import.
 */
@Global()
@Module({
  imports: [
    CqrsModule,
    ScheduleModule.forRoot(),
    InMemoryEventBusModule,
    EventStoreModule,
    FileStorageModule,
    UnitOfWorkModule,
    UnitConversionsModule
  ],
  providers: [OutboxPollerService],
  exports: [
    CqrsModule,
    InMemoryEventBusModule,
    EventStoreModule,
    FileStorageModule,
    UnitOfWorkModule,
    UnitConversionsModule
  ]
})
export class SharedInfrastructureModule {}
