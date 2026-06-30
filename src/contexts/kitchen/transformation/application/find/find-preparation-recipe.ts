import { PreparationRecipe } from '@contexts/kitchen/transformation/domain/preparation-recipe'
import { PreparationRecipeId } from '@contexts/kitchen/transformation/domain/preparation-recipe-id'
import { PreparationRecipeRepository } from '@contexts/kitchen/transformation/domain/repositories/preparation-recipe.repository'
import { PreparationRecipeNotFoundException } from '@contexts/kitchen/transformation/domain/exceptions/preparation-recipe-not-found.exception'

export class FindPreparationRecipe {
  constructor(private readonly repository: PreparationRecipeRepository) {}

  async run(id: string): Promise<PreparationRecipe> {
    const recipe = await this.repository.search(new PreparationRecipeId(id))

    if (!recipe) {
      throw new PreparationRecipeNotFoundException(id)
    }

    return recipe
  }
}
