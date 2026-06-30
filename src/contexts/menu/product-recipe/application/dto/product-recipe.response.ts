import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeItemResponse } from './product-recipe-item.response'

export class ProductRecipeResponse {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly items: ProductRecipeItemResponse[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDomain(recipe: ProductRecipe): ProductRecipeResponse {
    const primitives = recipe.toPrimitives()
    return new ProductRecipeResponse(
      primitives.id,
      primitives.productId,
      primitives.items.map(ProductRecipeItemResponse.fromPrimitives),
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
