import { IngredientCategoryListItem } from './ingredient-category-list-item'

export class IngredientCategoryListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly sortOrder: number | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromReadModel(item: IngredientCategoryListItem): IngredientCategoryListItemResponse {
    return new IngredientCategoryListItemResponse(
      item.id,
      item.name,
      item.description,
      item.icon,
      item.color,
      item.sortOrder,
      item.isActive,
      item.createdAt,
      item.updatedAt
    )
  }
}
