import { Ingredient } from '../../domain/ingredient'
import { IngredientResponse } from './ingredient.response'

export class IngredientListResponse {
  constructor(public readonly data: IngredientResponse[]) {}

  static fromDomain(ingredients: Ingredient[]): IngredientListResponse {
    return new IngredientListResponse(
      ingredients.map(ingredient => IngredientResponse.fromDomain(ingredient))
    )
  }
}
