import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface PurchaseOrderItemData {
  ingredientId: string
  quantityRequested: number
  unitId: string
  unitCost: number
}

interface PurchaseOrderSentPayload {
  purchaseOrderId: string
  orderNumber: string
  supplierId: string
  sentBy: string
  sentDate: Date
  expectedDeliveryDate: Date | null
  items: PurchaseOrderItemData[]
}

export class PurchaseOrderSentEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.sent'
  static readonly VERSION = 1

  constructor(
    payload: PurchaseOrderSentPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderSentEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      version: PurchaseOrderSentEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): PurchaseOrderSentPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderSentEvent {
    return new PurchaseOrderSentEvent(
      params.payload as PurchaseOrderSentPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
