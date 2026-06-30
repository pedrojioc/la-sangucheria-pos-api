import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemsAddedPayload {
  orderId: string
  itemIds: string[]
}

export class OrderItemsAddedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.items_added'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemsAddedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemsAddedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemsAddedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemsAddedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemsAddedEvent {
    return new OrderItemsAddedEvent(
      params.payload as OrderItemsAddedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
