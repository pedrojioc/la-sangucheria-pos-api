import { IngredientCategoryName } from '@contexts/inventory/ingredient-category/domain/ingredient-category-name'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class IngredientCategoryNameMother {
  static create(value: string): IngredientCategoryName {
    return new IngredientCategoryName(value)
  }

  static random(): IngredientCategoryName {
    return new IngredientCategoryName(StringMother.random({ min: 2, max: 100 }))
  }

  static withName(name: string): IngredientCategoryName {
    return new IngredientCategoryName(name)
  }

  static carnes(): IngredientCategoryName {
    return new IngredientCategoryName('Carnes')
  }

  static vegetales(): IngredientCategoryName {
    return new IngredientCategoryName('Vegetales')
  }
}
