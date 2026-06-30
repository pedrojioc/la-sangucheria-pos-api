import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface CustomerUpdatedEventPayload {
  customerId: string
}

export class CustomerUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'customer.updated'
  static readonly VERSION = 1

  constructor(
    payload: CustomerUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: CustomerUpdatedEvent.EVENT_NAME,
      aggregateId: payload.customerId,
      version: CustomerUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): CustomerUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): CustomerUpdatedEvent {
    return new CustomerUpdatedEvent(
      params.payload as CustomerUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
