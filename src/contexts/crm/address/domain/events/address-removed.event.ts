import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface AddressRemovedEventPayload {
  addressId: string
  customerId: string
}

export class AddressRemovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'address.removed'
  static readonly VERSION = 1

  constructor(
    payload: AddressRemovedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: AddressRemovedEvent.EVENT_NAME,
      aggregateId: payload.addressId,
      version: AddressRemovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): AddressRemovedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): AddressRemovedEvent {
    return new AddressRemovedEvent(
      params.payload as AddressRemovedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
