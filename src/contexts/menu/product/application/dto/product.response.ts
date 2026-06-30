import { Product } from '../../domain/product'
import { ProductAvailability } from '../services/product-availability-query.service'
import { InventoryStrategyType } from '../../domain/inventory-strategy-type'

export class ProductResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string,
    public readonly ingredientId: string | null,
    public readonly inventoryStrategyType: InventoryStrategyType,
    public readonly price: number,
    public readonly imageUrl: string | null,
    public readonly preparationTime: number | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number,
    public readonly sku: string,
    public readonly tags: string[],
    public readonly availability: ProductAvailability,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDomain(product: Product, availability: ProductAvailability): ProductResponse {
    const primitives = product.toPrimitives()

    return new ProductResponse(
      primitives.id,
      primitives.name,
      primitives.description,
      primitives.categoryId,
      primitives.ingredientId,
      primitives.inventoryStrategyType,
      primitives.price,
      primitives.imageUrl,
      primitives.preparationTime,
      primitives.isActive,
      primitives.displayOrder,
      primitives.sku,
      primitives.tags,
      availability,
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
