import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface IngredientCategoryCreatedPayload {
  id: string
  name: string
}

export class IngredientCategoryCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient-category.created'
  static readonly VERSION = 1

  constructor(
    payload: IngredientCategoryCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientCategoryCreatedEvent.EVENT_NAME,
      aggregateId: payload.id,
      version: IngredientCategoryCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): IngredientCategoryCreatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): IngredientCategoryCreatedEvent {
    return new IngredientCategoryCreatedEvent(
      params.payload as IngredientCategoryCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
