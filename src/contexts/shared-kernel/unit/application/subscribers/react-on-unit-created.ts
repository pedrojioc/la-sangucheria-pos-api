import { Injectable } from '@nestjs/common'
import { DomainEventClass } from '@/shared/domain/events/domain-event'
import { DomainEventSubscriber } from '@/shared/domain/events/domain-event-subscriber'
import { UnitCreatedEvent } from '../../domain/events/unit-created.event'

@Injectable()
export class ReactOnUnitCreated implements DomainEventSubscriber<UnitCreatedEvent> {
  subscribedTo(): DomainEventClass[] {
    return [UnitCreatedEvent]
  }

  async on(event: UnitCreatedEvent): Promise<void> {
    // TODO: Implement logic when unit is created (e.g., logging, notifications, etc.)
    const payload = event.toPrimitives()
    console.log(`Unit created: ${payload.name} (${payload.symbol})`)
  }
}
