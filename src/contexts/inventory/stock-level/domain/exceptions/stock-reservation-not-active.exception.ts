import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class StockReservationNotActive extends BusinessRuleViolationException {
  constructor(public readonly reservationId: string) {
    super(`Stock reservation ${reservationId} is not ACTIVE`)
  }
}
