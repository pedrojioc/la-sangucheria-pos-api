import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderDiscountRemovedPayload {
  orderId: string
}

export class OrderDiscountRemovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.discount_removed'
  static readonly VERSION = 1

  constructor(
    payload: OrderDiscountRemovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderDiscountRemovedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderDiscountRemovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderDiscountRemovedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderDiscountRemovedEvent {
    return new OrderDiscountRemovedEvent(
      params.payload as OrderDiscountRemovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
