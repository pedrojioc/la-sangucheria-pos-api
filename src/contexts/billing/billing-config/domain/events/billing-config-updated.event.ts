import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface BillingConfigUpdatedPayload {
  id: string
}

export class BillingConfigUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'billing-config.updated'
  static readonly VERSION = 1

  constructor(
    payload: BillingConfigUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: BillingConfigUpdatedEvent.EVENT_NAME,
      aggregateId: payload.id,
      version: BillingConfigUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): BillingConfigUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): BillingConfigUpdatedEvent {
    return new BillingConfigUpdatedEvent(
      params.payload as BillingConfigUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
