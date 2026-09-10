import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'

/**
 * ReleaseStockForItem - Use Case
 *
 * Releases (ACTIVE -> RELEASED) the reservation(s) held for one order
 * item, typically on item cancellation. Idempotent: if no ACTIVE
 * reservation exists for the given (orderId, itemId), this is a no-op —
 * terminality on the aggregate itself guards against reprocessing.
 */
export class ReleaseStockForItem {
  constructor(private readonly reservationRepository: StockReservationRepository) {}

  async run(orderId: string, itemId: string): Promise<void> {
    const reservations = await this.reservationRepository.findActiveByOrderItem(orderId, itemId)

    for (const reservation of reservations) {
      reservation.release()
      await this.reservationRepository.save(reservation)
    }
  }
}
