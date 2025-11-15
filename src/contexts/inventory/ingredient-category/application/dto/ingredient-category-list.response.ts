import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryResponse } from './ingredient-category.response'

export class IngredientCategoryListResponse {
  constructor(public readonly data: IngredientCategoryResponse[]) {}

  static fromDomain(categories: IngredientCategory[]): IngredientCategoryListResponse {
    const items = categories.map(category => IngredientCategoryResponse.fromDomain(category))
    return new IngredientCategoryListResponse(items)
  }
}
