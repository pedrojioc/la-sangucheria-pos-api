import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class NoStockAvailableException extends BusinessRuleViolationException {
  constructor(ingredientId: string) {
    super(`No hay stock disponible del ingrediente para realizar esta transformación`)
    this.ingredientId = ingredientId
  }

  readonly ingredientId: string
}
