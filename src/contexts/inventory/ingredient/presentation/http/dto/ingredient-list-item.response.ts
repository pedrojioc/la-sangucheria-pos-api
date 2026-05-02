import { IngredientListItem } from '@/contexts/inventory/ingredient/application/dto/ingredient-list-item'

export class IngredientListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly category: {
      id: string
      name: string
      color: string | null
    },
    public readonly unit: {
      id: string
      name: string
      symbol: string
    },
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean
  ) {}

  static fromReadModel(item: IngredientListItem): IngredientListItemResponse {
    return new IngredientListItemResponse(
      item.id,
      item.name,
      item.description,
      item.category,
      item.unit,
      item.minimumStock !== null ? Number(item.minimumStock) : null,
      item.maximumStock !== null ? Number(item.maximumStock) : null,
      item.isPerishable,
      item.shelfLifeDays,
      item.storageLocation,
      item.isActive
    )
  }
}
