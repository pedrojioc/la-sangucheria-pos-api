import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface CategoryCreatedEventPayload {
  categoryId: string
  name: string
}

export class CategoryCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'category.created'
  static readonly VERSION = 1

  constructor(
    payload: CategoryCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: CategoryCreatedDomainEvent.EVENT_NAME,
      aggregateId: payload.categoryId,
      version: CategoryCreatedDomainEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): CategoryCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): CategoryCreatedDomainEvent {
    return new CategoryCreatedDomainEvent(
      params.payload as CategoryCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
