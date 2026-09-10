import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'
import { OrderPaymentPrimitives } from '../order-payment'
import { OrderSplitPrimitives } from '../order-split'

export interface OrderClosedItemPayload {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  /** Proportional tax per item: item.lineTotal / order.total * order.taxAmount. Zero if order.total is 0. */
  taxAmount: number
  /**
   * v3 field — the closed order item's own aggregate id, needed downstream
   * to look up a matching StockReservation by (orderId, itemId). Defaults
   * to '' when deserializing v1/v2 payloads (backward compat).
   */
  itemId: string
}

export interface OrderClosedTaxConfigPayload {
  rate: number
  type: string
  inclusive: boolean
}

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
  // --- NEW (fiscal enrichment, additive — VERSION 2) ---
  subtotal: number
  discountTotal: number
  taxBase: number
  taxAmount: number
  taxConfig: OrderClosedTaxConfigPayload
  items: OrderClosedItemPayload[]
  customerDocumentType: string | null // from Customer at close time; null => Consumidor Final
  customerDocumentNumber: string | null
}

export class OrderClosedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.closed'
  static readonly VERSION = 3

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
    const raw = params.payload as any
    const rawItems = raw.items as Array<Record<string, unknown>> | undefined
    const items: OrderClosedItemPayload[] = (rawItems ?? []).map(item => ({
      ...(item as Omit<OrderClosedItemPayload, 'itemId'>),
      itemId: (item.itemId as string | undefined) ?? ''
    })) as OrderClosedItemPayload[]

    return new OrderClosedEvent(
      {
        ...(raw as Omit<OrderClosedPayload, 'items'>),
        items
      } as OrderClosedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
