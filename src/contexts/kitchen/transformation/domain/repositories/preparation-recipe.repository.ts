import { PreparationRecipe } from '../preparation-recipe'
import { PreparationRecipeId } from '../preparation-recipe-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export abstract class PreparationRecipeRepository {
  abstract save(recipe: PreparationRecipe): Promise<void>

  abstract search(id: PreparationRecipeId): Promise<PreparationRecipe | null>

  /**
   * Busca receta por ingrediente base
   * Ejemplo: Buscar receta que transforma "Morro Crudo"
   */
  abstract findByBaseIngredient(ingredientId: IngredientId): Promise<PreparationRecipe | null>

  /**
   * Busca recetas activas
   */
  abstract findActive(): Promise<PreparationRecipe[]>

  abstract searchAll(): Promise<PreparationRecipe[]>
}
