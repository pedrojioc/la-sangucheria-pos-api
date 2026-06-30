import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemRemovedPayload {
  orderId: string
  itemId: string
}

export class OrderItemRemovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_removed'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemRemovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemRemovedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemRemovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemRemovedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemRemovedEvent {
    return new OrderItemRemovedEvent(
      params.payload as OrderItemRemovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
