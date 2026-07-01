import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { DiscountPrimitives } from '../discount'

export interface OrderDiscountAppliedPayload {
  orderId: string
  discount: DiscountPrimitives
}

export class OrderDiscountAppliedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.discount_applied'
  static readonly VERSION = 1

  constructor(
    payload: OrderDiscountAppliedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderDiscountAppliedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderDiscountAppliedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderDiscountAppliedPayload {
    return this.payload
  }

  static fromPrimitives(
    params: DomainEventFromPrimitivesParams
  ): OrderDiscountAppliedEvent {
    return new OrderDiscountAppliedEvent(
      params.payload as OrderDiscountAppliedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
