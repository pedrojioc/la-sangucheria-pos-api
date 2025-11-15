import { Ingredient } from '../../domain/ingredient'
import { IngredientResponse } from './ingredient.response'

export class IngredientListResponse {
  constructor(public readonly data: IngredientResponse[]) {}

  static fromDomain(ingredients: Ingredient[]): IngredientListResponse {
    const items = ingredients.map(ingredient => IngredientResponse.fromDomain(ingredient))
    return new IngredientListResponse(items)
  }
}
