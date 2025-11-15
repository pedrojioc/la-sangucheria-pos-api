import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { InMemoryNestEventBus } from './in-memory-nest-event-bus'
import {
  DOMAIN_SUBSCRIBERS,
  IN_MEMORY_EVENT_SUBSCRIBERS,
  DomainSubscribersArray
} from '../providers/event-bus.tokens'
import { EventBus } from '@/shared/domain/events'

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Configuración optimizada para POS
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20, // Suficiente para múltiples subscribers
      verboseMemoryLeak: false,
      ignoreErrors: false
    })
  ],
  providers: [
    ...DOMAIN_SUBSCRIBERS,
    {
      provide: IN_MEMORY_EVENT_SUBSCRIBERS,
      useFactory: (...subscribers): DomainSubscribersArray => subscribers,
      inject: [...DOMAIN_SUBSCRIBERS]
    },
    InMemoryNestEventBus,
    {
      provide: EventBus,
      useExisting: InMemoryNestEventBus
    }
  ],
  exports: [EventBus, InMemoryNestEventBus, IN_MEMORY_EVENT_SUBSCRIBERS]
})
export class InMemoryEventBusModule {}
