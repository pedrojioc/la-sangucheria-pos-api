import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { SupplierCreatedEvent } from '../../domain/events/supplier-created.event'

@Injectable()
export class ReactOnSupplierCreated implements DomainEventSubscriber<SupplierCreatedEvent> {
  subscribedTo(): DomainEventClass[] {
    return [SupplierCreatedEvent]
  }

  async on(event: SupplierCreatedEvent): Promise<void> {
    // TODO: Implement side effects when a supplier is created
    // For example: send notification, update analytics, etc.
    const payload = event.toPrimitives()
    console.log(`Supplier created: ${payload.name} (${payload.supplierId})`)
  }
}
