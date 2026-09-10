import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class InsufficientStockForReservation extends BusinessRuleViolationException {
  constructor(
    public readonly ingredientId: string,
    public readonly required: number,
    public readonly available: number
  ) {
    super(
      `Insufficient stock for ingredient ${ingredientId}: required ${required}, available ${available}`
    )
  }
}
