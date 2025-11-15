import { IngredientCategoryDescription } from '@contexts/inventory/ingredient-category/domain/ingredient-category-description'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class IngredientCategoryDescriptionMother {
  static create(value: string): IngredientCategoryDescription {
    return new IngredientCategoryDescription(value)
  }

  static random(): IngredientCategoryDescription {
    return new IngredientCategoryDescription(StringMother.random({ min: 5, max: 200 }))
  }

  static empty(): null {
    return null
  }
}
