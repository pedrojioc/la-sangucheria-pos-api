import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface SupplierCreatedEventPayload {
  supplierId: string
  name: string
  email: string | null
}

export class SupplierCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'supplier.created'
  static readonly VERSION = 1

  constructor(
    payload: SupplierCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: SupplierCreatedEvent.EVENT_NAME,
      aggregateId: payload.supplierId,
      version: SupplierCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): SupplierCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): SupplierCreatedEvent {
    return new SupplierCreatedEvent(
      params.payload as SupplierCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
