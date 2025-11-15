import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface ProductCreatedEventPayload {
  productId: string
  name: string
  categoryId: string
  price: number
  sku: string
  description: string | null
  recipeId: string | null
  image: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  tags: string[]
}

export class ProductCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.created'
  static readonly VERSION = 1

  constructor(
    payload: ProductCreatedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductCreatedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductCreatedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ProductCreatedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ProductCreatedEvent {
    return new ProductCreatedEvent(
      params.payload as ProductCreatedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
