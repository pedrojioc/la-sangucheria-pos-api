import { Global, Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { InMemoryEventBusModule } from './event-bus/in-memory/in-memory-event-bus.module'
import { EventStoreModule } from './event-sourcing/event-store.module'
import { FileStorageModule } from './storage/file-storage.module'

// Buses

@Global()
@Module({
  imports: [CqrsModule, InMemoryEventBusModule, EventStoreModule, FileStorageModule],
  exports: [CqrsModule, InMemoryEventBusModule, EventStoreModule, FileStorageModule]
})
export class SharedInfrastructureModule {}
