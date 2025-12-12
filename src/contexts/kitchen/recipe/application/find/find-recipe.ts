import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'
import { RecipeId } from '@contexts/kitchen/recipe/domain/recipe-id'
import { RecipeRepository } from '@contexts/kitchen/recipe/domain/repositories/recipe.repository'
import { RecipeNotFound } from '@contexts/kitchen/recipe/domain/exceptions/recipe-not-found.exception'

export class FindRecipe {
  constructor(private readonly repository: RecipeRepository) {}

  async run(id: string): Promise<Recipe> {
    const recipe = await this.repository.search(new RecipeId(id))

    if (!recipe) {
      throw new RecipeNotFound(id)
    }

    return recipe
  }
}
