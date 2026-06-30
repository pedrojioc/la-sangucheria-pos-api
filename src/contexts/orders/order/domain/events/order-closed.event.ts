import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { OrderPaymentPrimitives } from '../order-payment'
import { OrderSplitPrimitives } from '../order-split'

export interface OrderClosedPayload {
  orderId: string
  orderNumber: string
  tableId: string | null
  customerId: string | null
  total: number
  tip: number | null
  currency: string
  payments: OrderPaymentPrimitives[] | null
  splits: OrderSplitPrimitives[] | null
  closedBy: string | null
  closedAt: Date
}

export class OrderClosedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.closed'
  static readonly VERSION = 1

  constructor(
    payload: OrderClosedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderClosedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderClosedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderClosedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderClosedEvent {
    return new OrderClosedEvent(
      params.payload as OrderClosedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
