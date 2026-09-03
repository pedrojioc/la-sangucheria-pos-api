import { StringValueObject } from '@/shared/domain/value-objects/string'
import { IngredientCategoryDescriptionTooLong } from './exceptions/ingredient-category-description-too-long.exception'

export class IngredientCategoryDescription extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureLengthIsLessThan256(value)
  }

  private ensureLengthIsLessThan256(value: string) {
    if (value.length > 256) {
      throw new IngredientCategoryDescriptionTooLong()
    }
  }
}
