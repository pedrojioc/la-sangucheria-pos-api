import { MovementType } from '../../domain/movement-type'
import { InventoryLevelListItem } from './inventory-level-list-item'

export class InventoryLevelListItemResponse {
  constructor(
    public readonly id: string,
    public readonly ingredientId: string,
    public readonly ingredientName: string,
    public readonly categoryName: string,
    public readonly currentQuantity: number,
    public readonly unitId: string,
    public readonly unitName: string,
    public readonly unitSymbol: string,
    public readonly minimumQuantity: number,
    public readonly maximumQuantity: number | null,
    public readonly reorderPoint: number | null,
    public readonly isLowStock: boolean,
    public readonly isCriticalStock: boolean,
    public readonly isOutOfStock: boolean,
    public readonly lastMovementType: MovementType | null,
    public readonly updatedAt: Date
  ) {}

  static fromReadModel(item: InventoryLevelListItem): InventoryLevelListItemResponse {
    return new InventoryLevelListItemResponse(
      item.id,
      item.ingredientId,
      item.ingredientName,
      item.categoryName,
      item.currentQuantity,
      item.unitId,
      item.unitName,
      item.unitSymbol,
      item.minimumQuantity,
      item.maximumQuantity,
      item.reorderPoint,
      item.isLowStock,
      item.isCriticalStock,
      item.isOutOfStock,
      item.lastMovementType,
      item.updatedAt
    )
  }
}
