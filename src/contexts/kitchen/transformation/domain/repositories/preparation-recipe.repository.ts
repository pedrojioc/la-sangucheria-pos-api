import { PreparationRecipe } from '../preparation-recipe'
import { PreparationRecipeId } from '../preparation-recipe-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'

export abstract class PreparationRecipeRepository {
  abstract save(recipe: PreparationRecipe): Promise<void>

  abstract search(id: PreparationRecipeId): Promise<PreparationRecipe | null>

  abstract findByBaseIngredient(ingredientId: IngredientId): Promise<PreparationRecipe | null>

  abstract findActive(): Promise<PreparationRecipe[]>

  abstract searchAll(): Promise<PreparationRecipe[]>

  abstract matching(criteria: Criteria): Promise<PaginatedResult<PreparationRecipe>>
}
