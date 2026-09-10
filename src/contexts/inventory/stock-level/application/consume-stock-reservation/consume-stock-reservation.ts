import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'

/**
 * ConsumeStockReservation - Use Case
 *
 * Consumes the ACTIVE reservation(s) held for one order item at order
 * close: deducts each reservation's snapshotted quantity via FIFO
 * (DeductIngredient), then marks it CONSUMED. Returns false when no
 * ACTIVE reservation exists for (orderId, itemId) — the caller
 * (DeductIngredientsOnOrderClosed) uses that boolean as the sole
 * double-deduction guard, falling back to direct deduction.
 */
export class ConsumeStockReservation {
  constructor(
    private readonly reservationRepository: StockReservationRepository,
    private readonly deductIngredient: DeductIngredient
  ) {}

  async run(orderId: string, itemId: string, reason: string): Promise<boolean> {
    const reservations = await this.reservationRepository.findActiveByOrderItem(orderId, itemId)

    if (reservations.length === 0) {
      return false
    }

    for (const reservation of reservations) {
      const { ingredientId, quantity, unitId } = reservation.toPrimitives()
      await this.deductIngredient.run(ingredientId, quantity, unitId, reason, orderId, null)
      reservation.consume()
      await this.reservationRepository.save(reservation)
    }

    return true
  }
}
