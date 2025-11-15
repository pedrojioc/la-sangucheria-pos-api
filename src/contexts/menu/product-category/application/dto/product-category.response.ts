import { ProductCategory } from '../../domain/product-category'

export class ProductCategoryResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number
  ) {}

  static fromDomain(category: ProductCategory) {
    const primitives = category.toPrimitives()
    return new ProductCategoryResponse(
      primitives.id,
      primitives.name,
      primitives.description,
      primitives.icon,
      primitives.isActive,
      primitives.displayOrder
    )
  }
}
