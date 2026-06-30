import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@shared/domain/events'

export interface SentToKitchenItem {
  itemId: string
  stationId: string | null
  productName: string
  quantity: number
  notes: string | null
  modifiers: Array<{ name: string; price: number }>
}

export interface OrderSentToKitchenPayload {
  orderId: string
  orderNumber: string
  ticketId: string
  ticketNumber: number
  items: SentToKitchenItem[]
  sentBy: string
  sentAt: Date
  /**
   * v3 fields — table context frozen at send time.
   * Both are null for takeaway orders (no associated table).
   * Defaults to null when deserializing v1/v2 payloads (backward compat).
   */
  tableId: string | null
  tableLabel: string | null
}

/**
 * v1 payload shape — used only for backward-compatible deserialization.
 * v1 carried a flat `itemIds: string[]` without per-item enrichment.
 */
interface OrderSentToKitchenPayloadV1 {
  orderId: string
  ticketId: string
  ticketNumber: number
  itemIds: string[]
  sentBy: string
  sentAt: Date
}

export class OrderSentToKitchenEvent extends DomainEvent {
  static readonly EVENT_NAME = 'order.sent_to_kitchen'
  static readonly VERSION = 3

  constructor(
    payload: OrderSentToKitchenPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: OrderSentToKitchenEvent.EVENT_NAME,
      aggregateId: payload.orderId,
      version: OrderSentToKitchenEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): OrderSentToKitchenPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): OrderSentToKitchenEvent {
    const raw = params.payload

    // Backward-compatible: handle v1 payloads that carry itemIds instead of items
    if (Array.isArray(raw.itemIds) && !Array.isArray(raw.items)) {
      const v1 = raw as unknown as OrderSentToKitchenPayloadV1
      const items: SentToKitchenItem[] = v1.itemIds.map(itemId => ({
        itemId,
        stationId: null,
        productName: '',
        quantity: 0,
        notes: null,
        modifiers: []
      }))

      return new OrderSentToKitchenEvent(
        {
          orderId: v1.orderId,
          orderNumber: '',
          ticketId: v1.ticketId,
          ticketNumber: v1.ticketNumber,
          items,
          sentBy: v1.sentBy,
          sentAt: v1.sentAt,
          // v1 payloads pre-date table context — default both fields to null
          tableId: null,
          tableLabel: null
        },
        params.metadata,
        params.eventId,
        params.occurredOn
      )
    }

    // v2 payloads pre-date table context — default both fields to null for backward compat
    return new OrderSentToKitchenEvent(
      {
        ...(raw as Omit<OrderSentToKitchenPayload, 'tableId' | 'tableLabel'>),
        tableId: (raw as any).tableId ?? null,
        tableLabel: (raw as any).tableLabel ?? null
      } as OrderSentToKitchenPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
