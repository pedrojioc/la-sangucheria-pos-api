import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface CustomerDeactivatedEventPayload {
  customerId: string
}

export class CustomerDeactivatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'customer.deactivated'
  static readonly VERSION = 1

  constructor(
    payload: CustomerDeactivatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: CustomerDeactivatedEvent.EVENT_NAME,
      aggregateId: payload.customerId,
      version: CustomerDeactivatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): CustomerDeactivatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): CustomerDeactivatedEvent {
    return new CustomerDeactivatedEvent(
      params.payload as CustomerDeactivatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
