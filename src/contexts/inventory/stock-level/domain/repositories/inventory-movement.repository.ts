import { InventoryMovement } from '../inventory-movement'
import { InventoryMovementId } from '../inventory-movement-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { MovementType } from '../movement-type'

export abstract class InventoryMovementRepository {
  abstract save(movement: InventoryMovement): Promise<void>

  abstract search(id: InventoryMovementId): Promise<InventoryMovement | null>

  /**
   * Busca todos los movimientos de un ingrediente
   * Ordenados por fecha (más reciente primero)
   */
  abstract findByIngredient(ingredientId: IngredientId): Promise<InventoryMovement[]>

  /**
   * Busca movimientos por tipo
   */
  abstract findByType(type: MovementType): Promise<InventoryMovement[]>

  /**
   * Busca movimientos por referencia (ej: ID de venta)
   */
  abstract findByReference(referenceId: string): Promise<InventoryMovement[]>

  abstract searchAll(): Promise<InventoryMovement[]>
}
