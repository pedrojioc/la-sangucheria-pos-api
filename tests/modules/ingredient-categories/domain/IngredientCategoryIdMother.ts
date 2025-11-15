import { IngredientCategoryId } from '@contexts/inventory/ingredient-category/domain/ingredient-category-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class IngredientCategoryIdMother {
  static create(value: string): IngredientCategoryId {
    return new IngredientCategoryId(value)
  }

  static random(): IngredientCategoryId {
    return new IngredientCategoryId(UuidMother.random())
  }
}
