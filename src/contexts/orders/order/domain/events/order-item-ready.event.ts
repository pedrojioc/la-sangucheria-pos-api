import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderItemReadyPayload {
  orderId: string
  itemId: string
  readyAt: Date
}

export class OrderItemReadyEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_ready'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemReadyPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemReadyEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemReadyEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemReadyPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderItemReadyEvent {
    return new OrderItemReadyEvent(
      params.payload as OrderItemReadyPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
