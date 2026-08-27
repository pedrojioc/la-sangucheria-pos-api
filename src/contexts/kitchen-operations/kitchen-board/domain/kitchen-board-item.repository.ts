export interface KitchenBoardItemData {
  id: string
  orderId: string
  orderNumber: string
  orderStatus: string
  tableId: string | null
  tableLabel: string | null
  itemId: string
  itemName: string
  stationId: string | null
  status: string
  quantity: number
  notes: string | null
  modifiers: Record<string, any>[]
  sentAt: Date
}

export interface KitchenBoardPlaceholderData {
  id: string
  orderId: string
  orderNumber: string
  tableId: string | null
  sentAt: Date
}

export abstract class KitchenBoardItemRepository {
  abstract upsert(item: KitchenBoardItemData): Promise<void>
  abstract updateStatus(
    itemId: string,
    status: string,
    timestamps: Partial<{
      readyAt: Date
      deliveredAt: Date
      cancelledAt: Date
    }>
  ): Promise<void>
  abstract existsByItemId(itemId: string): Promise<boolean>
  abstract findStationIdByItemId(itemId: string): Promise<string | null>

  /** Creates the OPEN placeholder row for an order with no items yet. Idempotent per orderId. */
  abstract insertPlaceholder(placeholder: KitchenBoardPlaceholderData): Promise<void>
  /** Removes the placeholder row (itemId IS NULL) once real items exist for the order. */
  abstract deletePlaceholderByOrderId(orderId: string): Promise<void>
  abstract updateOrderStatusByOrderId(orderId: string, orderStatus: string): Promise<void>
}
