import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemDeliveredPayload {
  orderId: string
  itemId: string
  deliveredBy: string
  deliveredAt: Date
  orderAutoCompleted: boolean
}

export class OrderItemDeliveredEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_delivered'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemDeliveredPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemDeliveredEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemDeliveredEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemDeliveredPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemDeliveredEvent {
    return new OrderItemDeliveredEvent(
      params.payload as OrderItemDeliveredPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
