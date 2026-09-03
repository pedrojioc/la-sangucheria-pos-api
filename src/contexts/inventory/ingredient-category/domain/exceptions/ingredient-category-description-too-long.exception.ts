import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class IngredientCategoryDescriptionTooLong extends InvalidValueObjectException {
  constructor() {
    super('Ingredient category description too long')
    this.name = 'IngredientCategoryDescriptionTooLong'
  }
}
