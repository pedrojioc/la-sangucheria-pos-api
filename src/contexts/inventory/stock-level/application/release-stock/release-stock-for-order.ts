import { StockReservationRepository } from '@contexts/inventory/stock-level/domain/repositories/stock-reservation.repository'

/**
 * ReleaseStockForOrder - Use Case
 *
 * Releases (ACTIVE -> RELEASED) every remaining ACTIVE reservation for an
 * order, on whole-order cancellation. Only ACTIVE rows are ever returned
 * by findActiveByOrder, so already-CONSUMED or already-RELEASED rows are
 * left untouched. Idempotent: repeating with no ACTIVE rows left is a
 * no-op.
 */
export class ReleaseStockForOrder {
  constructor(private readonly reservationRepository: StockReservationRepository) {}

  async run(orderId: string): Promise<void> {
    const reservations = await this.reservationRepository.findActiveByOrder(orderId)

    for (const reservation of reservations) {
      reservation.release()
      await this.reservationRepository.save(reservation)
    }
  }
}
