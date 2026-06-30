import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeProductCannotHaveIngredient extends DomainException {
  constructor() {
    super('A product with RECIPE inventory strategy cannot have an ingredientId')
  }
}
