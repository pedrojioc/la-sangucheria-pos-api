export interface KitchenBoardItemData {
  id: string
  orderId: string
  orderNumber: string
  itemId: string
  itemName: string
  stationId: string | null
  status: string
  quantity: number
  notes: string | null
  modifiers: Record<string, any>[]
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
}
