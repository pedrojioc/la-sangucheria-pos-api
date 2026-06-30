import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderOpenedPayload {
  orderId: string
  orderNumber: string
  type: string
  tableId: string | null
  customerId: string | null
  openedBy: string
  openedAt: Date
}

export class OrderOpenedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.opened'
  static readonly VERSION = 1

  constructor(
    payload: OrderOpenedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderOpenedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderOpenedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderOpenedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderOpenedEvent {
    return new OrderOpenedEvent(
      params.payload as OrderOpenedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
