export interface StockReservationLine {
  itemId: string
  ingredientId: string
  quantity: number
  unitId: string
}

export abstract class StockReservationPort {
  /** Throws InsufficientStockForReservation; all-or-nothing across lines. */
  abstract reserve(orderId: string, lines: StockReservationLine[]): Promise<void>

  abstract releaseForItem(orderId: string, itemId: string): Promise<void>

  abstract releaseForOrder(orderId: string): Promise<void>

  /** true when a reservation existed and was consumed; false = caller must deduct. */
  abstract consume(orderId: string, itemId: string, reason: string): Promise<boolean>
}
