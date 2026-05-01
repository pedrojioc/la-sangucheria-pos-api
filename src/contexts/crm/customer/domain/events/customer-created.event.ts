import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'
import { DocumentTypeValue } from '../customer-document-type'

export interface CustomerCreatedEventPayload {
  customerId: string
  name: string
  phone: string
  documentType: DocumentTypeValue
  documentNumber: string
}

export class CustomerCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'customer.created'
  static readonly VERSION = 1

  constructor(
    payload: CustomerCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: CustomerCreatedEvent.EVENT_NAME,
      aggregateId: payload.customerId,
      version: CustomerCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): CustomerCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): CustomerCreatedEvent {
    return new CustomerCreatedEvent(
      params.payload as CustomerCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
