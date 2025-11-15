import { IngredientCategory } from '../ingredient-category'
import { IngredientCategoryId } from '../ingredient-category-id'

export abstract class IngredientCategoryRepository {
  abstract save(ingredientCategory: IngredientCategory): Promise<void>

  abstract search(id: IngredientCategoryId): Promise<IngredientCategory | null>

  abstract searchAll(): Promise<IngredientCategory[]>
}
