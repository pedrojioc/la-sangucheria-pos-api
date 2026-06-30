import { ProductAvailability } from '../services/product-availability-query.service'
import { ProductListItem, ProductListItemOptionGroup } from './product-list-item'

export class ProductListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string,
    public readonly category: { id: string; name: string },
    public readonly ingredientId: string | null,
    public readonly price: number,
    public readonly imageUrl: string | null,
    public readonly preparationTime: number | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number,
    public readonly sku: string,
    public readonly tags: string[],
    public readonly inventoryStrategyType: 'RECIPE' | 'DIRECT' | 'NONE',
    public readonly availability: ProductAvailability,
    public readonly optionGroups: ProductListItemOptionGroup[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromReadModel(item: ProductListItem): ProductListItemResponse {
    return new ProductListItemResponse(
      item.id,
      item.name,
      item.description,
      item.categoryId,
      { id: item.categoryId, name: item.categoryName },
      item.ingredientId,
      item.price,
      item.imageUrl,
      item.preparationTime,
      item.isActive,
      item.displayOrder,
      item.sku,
      item.tags,
      item.inventoryStrategyType,
      item.availability,
      item.optionGroups,
      item.createdAt,
      item.updatedAt
    )
  }
}
