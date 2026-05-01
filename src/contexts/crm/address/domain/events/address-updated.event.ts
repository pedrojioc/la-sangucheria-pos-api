import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface AddressUpdatedEventPayload {
  addressId: string
  customerId: string
}

export class AddressUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'address.updated'
  static readonly VERSION = 1

  constructor(
    payload: AddressUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: AddressUpdatedEvent.EVENT_NAME,
      aggregateId: payload.addressId,
      version: AddressUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): AddressUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): AddressUpdatedEvent {
    return new AddressUpdatedEvent(
      params.payload as AddressUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
