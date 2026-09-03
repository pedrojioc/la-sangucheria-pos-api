import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeProductCannotHaveIngredient extends InvalidValueObjectException {
  constructor() {
    super('A product with RECIPE inventory strategy cannot have an ingredientId')
  }
}
