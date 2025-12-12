import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface RecipeUpdatedEventPayload {
  recipeId: string
  name: string
  description: string | null
  itemsCount: number
  yieldQuantity: number
  yieldUnitId: string
}

export class RecipeUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'recipe.updated'
  static readonly VERSION = 1

  constructor(
    payload: RecipeUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: RecipeUpdatedEvent.EVENT_NAME,
      aggregateId: payload.recipeId,
      version: RecipeUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): RecipeUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): RecipeUpdatedEvent {
    return new RecipeUpdatedEvent(
      params.payload as RecipeUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
