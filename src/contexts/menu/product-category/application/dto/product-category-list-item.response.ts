import { ProductCategoryListItem } from './product-category-list-item'

export class ProductCategoryListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly displayOrder: number,
    public readonly isActive: boolean,
    public readonly defaultStationId: string | null
  ) {}

  static fromReadModel(item: ProductCategoryListItem): ProductCategoryListItemResponse {
    return new ProductCategoryListItemResponse(
      item.id,
      item.name,
      item.description,
      item.icon,
      item.color,
      item.displayOrder,
      item.isActive,
      item.defaultStationId
    )
  }
}
