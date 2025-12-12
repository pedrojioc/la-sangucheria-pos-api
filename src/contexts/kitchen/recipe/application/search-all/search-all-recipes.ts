import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'
import { RecipeRepository } from '@contexts/kitchen/recipe/domain/repositories/recipe.repository'

export class SearchAllRecipes {
  constructor(private readonly repository: RecipeRepository) {}

  async run(): Promise<Recipe[]> {
    return this.repository.searchAll()
  }
}
