import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { InMemoryEventBusModule } from './event-bus/in-memory/in-memory-event-bus.module'
import { EventStoreModule } from './event-sourcing/event-store.module'
import { FileStorageModule } from './storage/file-storage.module'
import { UnitOfWorkModule } from './unit-of-work/unit-of-work.module'
import { UnitConversionsModule } from '@/contexts/shared-kernel/unit-conversion/unit-conversion.module'

@Global()
@Module({
  imports: [
    CqrsModule,
    InMemoryEventBusModule,
    EventStoreModule,
    FileStorageModule,
    UnitOfWorkModule,
    UnitConversionsModule
  ],
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
