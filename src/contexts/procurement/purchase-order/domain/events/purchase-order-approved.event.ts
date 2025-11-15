import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface PurchaseOrderApprovedPayload {
  purchaseOrderId: string
  orderNumber: string
  approvedBy: string
  approvedDate: Date
  totalAmount: number
  currency: string
}

export class PurchaseOrderApprovedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.approved'
  static readonly VERSION = 1

  constructor(
    payload: PurchaseOrderApprovedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderApprovedEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      version: PurchaseOrderApprovedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives() {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderApprovedEvent {
    return new PurchaseOrderApprovedEvent(
      params.payload as PurchaseOrderApprovedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
