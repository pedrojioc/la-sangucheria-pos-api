import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

interface PurchaseOrderRejectedPayload {
  purchaseOrderId: string
  orderNumber: string
  rejectedBy: string
  reason: string | null
}

export class PurchaseOrderRejectedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.rejected'
  static readonly VERSION = 1

  constructor(
    payload: PurchaseOrderRejectedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderRejectedEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      version: PurchaseOrderRejectedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): PurchaseOrderRejectedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderRejectedEvent {
    return new PurchaseOrderRejectedEvent(
      params.payload as PurchaseOrderRejectedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
