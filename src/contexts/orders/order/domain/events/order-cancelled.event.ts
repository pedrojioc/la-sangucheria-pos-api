import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderCancelledPayload {
  orderId: string
  reason: string
  cancelledBy: string
  cancelledAt: Date
  tableId: string | null
  customerId: string | null
  total: number
  currency: string
}

export class OrderCancelledEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.cancelled'
  static readonly VERSION = 1

  constructor(
    payload: OrderCancelledPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderCancelledEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderCancelledEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderCancelledPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderCancelledEvent {
    return new OrderCancelledEvent(
      params.payload as OrderCancelledPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
