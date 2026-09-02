import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ScheduleModule } from '@nestjs/schedule'
import { InMemoryEventBusModule } from './event-bus/in-memory/in-memory-event-bus.module'
import { EventStoreModule } from './event-sourcing/event-store.module'
import { FileStorageModule } from './storage/file-storage.module'
import { UnitOfWorkModule } from './unit-of-work/unit-of-work.module'
import { UnitConversionsModule } from '@/contexts/shared-kernel/unit-conversion/unit-conversion.module'

/**
 * OutboxPollerService (Slice 9, design D3) used to be registered HERE, but as
 * of the outbox-worker-process slice it has been relocated to WorkerModule
 * (src/worker.module.ts) — the API process no longer instantiates the
 * poller at all. WorkerModule now occupies the "shared sibling-parent" role
 * this module used to occupy for the poller's two dependencies:
 * EventStoreService (EventStoreModule) AND EventBusRouter
 * (InMemoryEventBusModule), which do not import each other. WorkerModule
 * imports THIS module (already @Global(), already importing both as
 * siblings and exporting both), which resolves both dependencies for the
 * poller with zero new imports and no circular module import.
 *
 * ScheduleModule.forRoot() stays here (not moved to WorkerModule) so
 * @Interval-based providers keep working wherever they're registered — it
 * only actually fires the poller's interval in the worker process, since
 * only the worker process provides OutboxPollerService.
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
  providers: [],
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
