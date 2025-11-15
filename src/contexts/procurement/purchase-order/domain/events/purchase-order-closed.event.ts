import {
  DomainEvent,
  DomainEventFromPrimitivesParams,
  DomainEventMetadata
} from '@/shared/domain/events'

interface PurchaseOrderClosedPayload {
  purchaseOrderId: string
  orderNumber: string
  closedBy: string
  closedDate: Date
  totalAmount: number
  currency: string
  itemsReceived: number
}

export class PurchaseOrderClosedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.closed'
  static readonly VERSION = 1

  readonly purchaseOrderId: string
  readonly orderNumber: string
  readonly closedBy: string
  readonly closedDate: Date
  readonly totalAmount: number
  readonly currency: string
  readonly itemsReceived: number

  constructor(
    payload: PurchaseOrderClosedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderClosedEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      version: PurchaseOrderClosedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })

    this.purchaseOrderId = payload.purchaseOrderId
    this.orderNumber = payload.orderNumber
    this.closedBy = payload.closedBy
    this.closedDate = payload.closedDate
    this.totalAmount = payload.totalAmount
    this.currency = payload.currency
    this.itemsReceived = payload.itemsReceived
  }

  toPrimitives(): PurchaseOrderClosedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderClosedEvent {
    return new PurchaseOrderClosedEvent(
      params.payload as PurchaseOrderClosedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
