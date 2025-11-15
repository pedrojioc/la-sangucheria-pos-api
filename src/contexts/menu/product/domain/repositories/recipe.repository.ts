import { Recipe } from '../recipe/recipe'
import { RecipeId } from '../../../../kitchen/recipe/domain/recipe-id'

export abstract class RecipeRepository {
  abstract save(recipe: Recipe): Promise<void>
  abstract search(id: RecipeId): Promise<Recipe | null>
  abstract searchAll(): Promise<Recipe[]>
  abstract delete(id: RecipeId): Promise<void>
}
