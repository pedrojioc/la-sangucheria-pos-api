import { MovementType } from '../../domain/movement-type'

export interface InventoryLevelListItem {
  id: string
  ingredientId: string
  ingredientName: string
  categoryName: string
  currentQuantity: number
  unitId: string
  unitName: string
  unitSymbol: string
  minimumQuantity: number
  maximumQuantity: number | null
  reorderPoint: number | null
  isLowStock: boolean
  isCriticalStock: boolean
  isOutOfStock: boolean
  lastMovementType: MovementType | null
  updatedAt: Date
}
