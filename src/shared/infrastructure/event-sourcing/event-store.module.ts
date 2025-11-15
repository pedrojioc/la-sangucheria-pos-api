import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventStoreEntity } from './persistence/event-store.entity'
import { EventStoreService } from './event-store.service'
import { PersistDomainEventsSubscriber } from './subscribers/persist-domain-events.subscriber'

@Module({
  imports: [TypeOrmModule.forFeature([EventStoreEntity])],
  providers: [EventStoreService, PersistDomainEventsSubscriber],
  exports: [EventStoreService]
})
export class EventStoreModule {}
