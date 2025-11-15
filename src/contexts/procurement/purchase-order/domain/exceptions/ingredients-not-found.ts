import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class IngredientsNotFound extends BusinessRuleViolationException {
  constructor(public readonly ingredientIds: string[]) {
    super(`Cannot create purchase order: Ingredients not found: ${ingredientIds.join(', ')}`)
  }
}
