import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface IngredientUpdatedEventPayload {
  ingredientId: string
  name: string
  ingredientCategoryId: string
  unitId: string
}

export class IngredientUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient.updated'
  static readonly VERSION = 1

  constructor(
    payload: IngredientUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientUpdatedEvent.EVENT_NAME,
      aggregateId: payload.ingredientId,
      version: IngredientUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): IngredientUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): IngredientUpdatedEvent {
    return new IngredientUpdatedEvent(
      params.payload as IngredientUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
