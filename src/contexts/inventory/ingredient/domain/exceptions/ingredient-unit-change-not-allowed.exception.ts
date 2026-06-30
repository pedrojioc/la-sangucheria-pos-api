import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class IngredientUnitChangeNotAllowedException extends BusinessRuleViolationException {
  constructor(ingredientId: string) {
    super(
      `La unidad de medida del ingrediente ${ingredientId} no puede modificarse porque ya tiene stock o transacciones registradas. ` +
        `Si necesitas otra unidad, crea un nuevo ingrediente.`
    )
    this.name = 'IngredientUnitChangeNotAllowedException'
  }
}
