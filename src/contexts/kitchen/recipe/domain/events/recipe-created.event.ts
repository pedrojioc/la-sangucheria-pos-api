import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface RecipeCreatedEventPayload {
  recipeId: string
  name: string
  description: string | null
  itemsCount: number
  yieldQuantity: number
  yieldUnitId: string
}

export class RecipeCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'recipe.created'
  static readonly VERSION = 1

  constructor(
    payload: RecipeCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: RecipeCreatedEvent.EVENT_NAME,
      aggregateId: payload.recipeId,
      version: RecipeCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): RecipeCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): RecipeCreatedEvent {
    return new RecipeCreatedEvent(
      params.payload as RecipeCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
