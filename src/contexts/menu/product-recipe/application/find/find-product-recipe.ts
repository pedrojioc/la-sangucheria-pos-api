import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeNotFound } from '@contexts/menu/product-recipe/domain/exceptions/product-recipe-not-found.exception'

export class FindProductRecipe {
  constructor(private readonly repository: ProductRecipeRepository) {}

  async run(productId: string): Promise<ProductRecipe> {
    const recipe = await this.repository.findByProductId(productId)

    if (!recipe) throw new ProductRecipeNotFound(productId)

    return recipe
  }
}
