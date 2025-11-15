import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface PurchaseOrderCreatedPayload {
  purchaseOrderId: string
  orderNumber: string
  supplierId: string
  requestedBy: string
  expectedDeliveryDate: Date | null
  itemsCount: number
  totalAmount: number
}

export class PurchaseOrderCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.created'
  static readonly VERSION = 1

  constructor(
    payload: PurchaseOrderCreatedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderCreatedEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      occurredOn,
      payload,
      metadata,
      version: PurchaseOrderCreatedEvent.VERSION,
      eventId
    })
  }

  toPrimitives() {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderCreatedEvent {
    return new PurchaseOrderCreatedEvent(
      params.payload as PurchaseOrderCreatedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
