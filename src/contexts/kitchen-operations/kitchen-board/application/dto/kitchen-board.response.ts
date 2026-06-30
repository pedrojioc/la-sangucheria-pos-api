export interface KitchenBoardItemResponse {
  id: string
  itemId: string
  itemName: string
  stationId: string | null
  status: string
  quantity: number
  notes: string | null
  modifiers: Record<string, any>[]
  sentAt: Date
  readyAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
}

export interface KitchenBoardOrderGroup {
  orderId: string
  orderNumber: string
  oldestSentAt: Date
  items: KitchenBoardItemResponse[]
}

export type KitchenBoardResponse = KitchenBoardOrderGroup[]
