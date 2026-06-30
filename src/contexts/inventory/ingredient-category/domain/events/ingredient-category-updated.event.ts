import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface IngredientCategoryUpdatedPayload {
  id: string
  name: string
}

export class IngredientCategoryUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient-category.updated'
  static readonly VERSION = 1

  constructor(
    payload: IngredientCategoryUpdatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientCategoryUpdatedEvent.EVENT_NAME,
      aggregateId: payload.id,
      version: IngredientCategoryUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): IngredientCategoryUpdatedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): IngredientCategoryUpdatedEvent {
    return new IngredientCategoryUpdatedEvent(
      params.payload as IngredientCategoryUpdatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
