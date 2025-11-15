import { Product } from '../../domain/product'

export class ProductResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string,
    public readonly recipeId: string | null,
    public readonly price: number,
    public readonly imageUrl: string | null,
    public readonly preparationTime: number | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number,
    public readonly sku: string,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDomain(product: Product): ProductResponse {
    const primitives = product.toPrimitives()

    return new ProductResponse(
      primitives.id,
      primitives.name,
      primitives.description,
      primitives.categoryId,
      primitives.recipeId,
      primitives.price,
      primitives.imageUrl,
      primitives.preparationTime,
      primitives.isActive,
      primitives.displayOrder,
      primitives.sku,
      primitives.tags,
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
