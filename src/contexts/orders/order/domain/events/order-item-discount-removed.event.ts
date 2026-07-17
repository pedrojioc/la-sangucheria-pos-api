import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemDiscountRemovedPayload {
  orderId: string
  itemId: string
}

export class OrderItemDiscountRemovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_discount_removed'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemDiscountRemovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemDiscountRemovedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemDiscountRemovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemDiscountRemovedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemDiscountRemovedEvent {
    return new OrderItemDiscountRemovedEvent(
      params.payload as OrderItemDiscountRemovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
