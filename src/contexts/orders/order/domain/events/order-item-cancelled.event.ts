import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemCancelledPayload {
  orderId: string
  itemId: string
  reason: string
  cancelledBy: string
  cancelledAt: Date
}

export class OrderItemCancelledEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_cancelled'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemCancelledPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemCancelledEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemCancelledEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemCancelledPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemCancelledEvent {
    return new OrderItemCancelledEvent(
      params.payload as OrderItemCancelledPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
