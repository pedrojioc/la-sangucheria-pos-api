import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface OrderReadyPayload {
  orderId: string
  orderNumber: string
  tableId: string | null
  readyAt: Date
}

export class OrderReadyEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.ready'
  static readonly VERSION = 1

  constructor(
    payload: OrderReadyPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderReadyEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderReadyEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderReadyPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderReadyEvent {
    return new OrderReadyEvent(
      params.payload as OrderReadyPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
