import { ProductRecipe } from '../product-recipe'

export abstract class ProductRecipeRepository {
  abstract save(recipe: ProductRecipe): Promise<void>
  abstract findByProductId(productId: string): Promise<ProductRecipe | null>
}
