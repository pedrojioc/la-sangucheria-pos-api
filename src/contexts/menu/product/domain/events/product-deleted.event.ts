import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface ProductDeletedEventPayload {
  productId: string
}

export class ProductDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.deleted'
  static readonly VERSION = 1

  constructor(
    payload: ProductDeletedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductDeletedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      version: ProductDeletedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): ProductDeletedEventPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): ProductDeletedEvent {
    return new ProductDeletedEvent(
      params.payload as ProductDeletedEventPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
