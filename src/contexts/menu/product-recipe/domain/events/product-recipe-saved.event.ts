import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface ProductRecipeSavedPayload {
  recipeId: string
  productId: string
  itemsCount: number
}

export class ProductRecipeSavedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product_recipe.saved'
  static readonly VERSION = 1

  constructor(
    payload: ProductRecipeSavedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductRecipeSavedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductRecipeSavedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ProductRecipeSavedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ProductRecipeSavedEvent {
    return new ProductRecipeSavedEvent(
      params.payload as ProductRecipeSavedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
