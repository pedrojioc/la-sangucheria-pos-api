export class ProductRecipeItemResponse {
  constructor(
    public readonly ingredientId: string,
    public readonly quantity: number,
    public readonly unitId: string
  ) {}

  static fromPrimitives(primitives: {
    ingredientId: string
    quantity: number
    unitId: string
  }): ProductRecipeItemResponse {
    return new ProductRecipeItemResponse(
      primitives.ingredientId,
      primitives.quantity,
      primitives.unitId
    )
  }
}
