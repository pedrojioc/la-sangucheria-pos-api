import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface RecipeDeletedEventPayload {
  recipeId: string
  name: string
}

export class RecipeDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'recipe.deleted'
  static readonly VERSION = 1

  constructor(
    payload: RecipeDeletedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: RecipeDeletedEvent.EVENT_NAME,
      aggregateId: payload.recipeId,
      version: RecipeDeletedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): RecipeDeletedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): RecipeDeletedEvent {
    return new RecipeDeletedEvent(
      params.payload as RecipeDeletedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
