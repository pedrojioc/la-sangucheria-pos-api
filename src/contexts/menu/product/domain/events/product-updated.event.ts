import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface ProductUpdatedEventPayload {
  productId: string
  name: string
  categoryId: string
  price: number
  description: string | null
  recipeId: string | null
  image: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  tags: string[]
}

export class ProductUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.updated'
  static readonly VERSION = 1

  constructor(
    payload: ProductUpdatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductUpdatedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductUpdatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ProductUpdatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ProductUpdatedEvent {
    return new ProductUpdatedEvent(
      params.payload as ProductUpdatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
