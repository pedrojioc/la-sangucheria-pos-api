import { DomainEvent, EventBus } from '@/shared/domain/events'
import { Inject } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { DomainSubscribersArray, IN_MEMORY_EVENT_SUBSCRIBERS } from '../providers/event-bus.tokens'

export class InMemoryNestEventBus implements EventBus {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(IN_MEMORY_EVENT_SUBSCRIBERS)
    private subscribers: DomainSubscribersArray
  ) {
    this.addSubscribers(this.subscribers)
  }

  publish(events: DomainEvent[]): Promise<void> {
    events.forEach(event => {
      setImmediate(() => {
        this.eventEmitter.emit(event.eventName, event)
      })
    })

    return Promise.resolve()
  }

  addSubscribers(subscribers: DomainSubscribersArray): void {
    console.log(
      'Adding subscribers:',
      subscribers.map(s => s.constructor.name)
    )
    subscribers.forEach(subscriber => {
      subscriber.subscribedTo().forEach(eventClass => {
        this.eventEmitter.on(eventClass.EVENT_NAME, async (event: DomainEvent) => {
          try {
            await subscriber.on(event)
          } catch (error) {
            console.error(
              `Error handling event ${eventClass.EVENT_NAME} with subscriber ${subscriber.constructor.name}:`,
              error
            )
          }
        })
      })
    })
  }
}
