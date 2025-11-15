import { InventoryLevel } from '../inventory-level'
import { InventoryLevelId } from '../inventory-level-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'

export abstract class InventoryLevelRepository {
  abstract save(level: InventoryLevel): Promise<void>

  abstract search(id: InventoryLevelId): Promise<InventoryLevel | null>

  /**
   * Busca el nivel de inventario de un ingrediente específico
   */
  abstract findByIngredient(ingredientId: IngredientId): Promise<InventoryLevel | null>

  /**
   * Busca todos los ingredientes con stock bajo (below minimum)
   */
  abstract findLowStock(): Promise<InventoryLevel[]>

  /**
   * Busca todos los ingredientes que necesitan reorden (below reorderPoint)
   */
  abstract findBelowReorderPoint(): Promise<InventoryLevel[]>

  /**
   * Busca todos los ingredientes sin stock
   */
  abstract findOutOfStock(): Promise<InventoryLevel[]>

  abstract searchAll(): Promise<InventoryLevel[]>
}
