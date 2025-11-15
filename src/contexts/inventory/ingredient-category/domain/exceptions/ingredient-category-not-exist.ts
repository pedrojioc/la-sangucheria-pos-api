import { IngredientCategoryId } from '../ingredient-category-id'

export class IngredientCategoryNotExist extends Error {
  constructor(id: IngredientCategoryId) {
    super(`Ingredient category with id ${id.value} not exist`)
    this.name = 'IngredientCategoryNotExist'
  }
}
