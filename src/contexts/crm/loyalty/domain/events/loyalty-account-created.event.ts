import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface LoyaltyAccountCreatedEventPayload {
  loyaltyAccountId: string
  customerId: string
}

export class LoyaltyAccountCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'loyalty-account.created'
  static readonly VERSION = 1

  constructor(
    payload: LoyaltyAccountCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: LoyaltyAccountCreatedEvent.EVENT_NAME,
      aggregateId: payload.loyaltyAccountId,
      version: LoyaltyAccountCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): LoyaltyAccountCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): LoyaltyAccountCreatedEvent {
    return new LoyaltyAccountCreatedEvent(
      params.payload as LoyaltyAccountCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
