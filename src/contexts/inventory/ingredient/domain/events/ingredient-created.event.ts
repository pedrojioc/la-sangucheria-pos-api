import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface IngredientCreatedEventPayload {
  ingredientId: string
  name: string
  ingredientCategoryId: string
}

export class IngredientCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient.created'
  static readonly VERSION = 1

  constructor(
    payload: IngredientCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientCreatedEvent.EVENT_NAME,
      aggregateId: payload.ingredientId,
      version: IngredientCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): IngredientCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): IngredientCreatedEvent {
    return new IngredientCreatedEvent(
      params.payload as IngredientCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
