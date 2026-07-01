import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { DiscountPrimitives } from '../discount'

export interface OrderItemDiscountAppliedPayload {
  orderId: string
  itemId: string
  discount: DiscountPrimitives
}

export class OrderItemDiscountAppliedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.item_discount_applied'
  static readonly VERSION = 1

  constructor(
    payload: OrderItemDiscountAppliedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderItemDiscountAppliedEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderItemDiscountAppliedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderItemDiscountAppliedPayload {
    return this.payload
  }

  static fromPrimitives(
    params: DomainEventFromPrimitivesParams
  ): OrderItemDiscountAppliedEvent {
    return new OrderItemDiscountAppliedEvent(
      params.payload as OrderItemDiscountAppliedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
