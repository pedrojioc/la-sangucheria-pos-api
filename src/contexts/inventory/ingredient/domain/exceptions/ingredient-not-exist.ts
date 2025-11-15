import { IngredientId } from '../ingredient-id'

export class IngredientNotExist extends Error {
  constructor(id: IngredientId) {
    super(`Ingredient with id ${id.value} not exist`)
    this.name = 'IngredientNotExist'
  }
}
