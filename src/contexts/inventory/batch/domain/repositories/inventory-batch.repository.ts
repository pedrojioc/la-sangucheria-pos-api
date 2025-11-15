import { InventoryBatch } from '../inventory-batch'
import { InventoryBatchId } from '../inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export abstract class InventoryBatchRepository {
  abstract save(batch: InventoryBatch): Promise<void>

  abstract search(id: InventoryBatchId): Promise<InventoryBatch | null>

  /**
   * Busca todos los batches disponibles (no agotados) de un ingrediente
   * Ordenados por fecha de compra (FIFO)
   */
  abstract findAvailableByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]>

  /**
   * Busca todos los batches de un ingrediente (incluye agotados)
   */
  abstract findByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]>

  abstract searchAll(): Promise<InventoryBatch[]>
}
