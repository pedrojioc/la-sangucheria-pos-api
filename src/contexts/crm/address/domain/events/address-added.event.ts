import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface AddressAddedEventPayload {
  addressId: string
  customerId: string
}

export class AddressAddedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'address.added'
  static readonly VERSION = 1

  constructor(
    payload: AddressAddedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: AddressAddedEvent.EVENT_NAME,
      aggregateId: payload.addressId,
      version: AddressAddedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): AddressAddedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): AddressAddedEvent {
    return new AddressAddedEvent(
      params.payload as AddressAddedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
