import {
  DomainEventMetadata,
  DomainEvent,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

interface PurchaseOrderItemReceivedPayload {
  purchaseOrderId: string
  orderNumber: string
  itemId: string
  ingredientId: string
  quantityReceived: number
  unitId: string
  unitCost: number
  currency: string
  supplierId: string
  receivedDate: Date
  occurredOn: Date
}

/**
 * PurchaseOrderItemReceived - Domain Event
 *
 * Este es el evento CLAVE que conecta Procurement con Inventory.
 *
 * Cuando se emite este evento:
 * - Inventory Context lo escucha
 * - Ejecuta RegisterPurchase use case
 * - Crea InventoryBatch con los datos reales recibidos
 * - Actualiza InventoryLevel
 *
 * Flujo:
 * PurchaseOrder.registerItemReception()
 *   → Emite PurchaseOrderItemReceived
 *   → OnPurchaseOrderItemReceived (Inventory subscriber)
 *   → RegisterPurchase.run()
 *   → InventoryBatch created
 */
export class PurchaseOrderItemReceivedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'procurement.purchase_order.item_received'
  static readonly VERSION = 1

  constructor(
    payload: PurchaseOrderItemReceivedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: PurchaseOrderItemReceivedEvent.EVENT_NAME,
      aggregateId: payload.purchaseOrderId,
      version: PurchaseOrderItemReceivedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): PurchaseOrderItemReceivedPayload {
    return this.payload
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): PurchaseOrderItemReceivedEvent {
    return new PurchaseOrderItemReceivedEvent(
      params.payload as PurchaseOrderItemReceivedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
