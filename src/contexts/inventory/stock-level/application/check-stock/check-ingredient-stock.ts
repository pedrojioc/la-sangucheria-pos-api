import { InventoryBatchRepository } from '@/contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { FifoInventoryService } from '@/contexts/inventory/batch/domain/services/fifo-inventory.service'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'

/**
 * CheckIngredientStock - Query Use Case
 *
 * Verifica si hay stock suficiente de un ingrediente
 * usando los batches disponibles (FIFO).
 */
export class CheckIngredientStock {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly fifoService: FifoInventoryService
  ) {}

  async run(ingredientId: string, quantity: number, unitId: string): Promise<boolean> {
    const ingredientIdVO = new IngredientId(ingredientId)
    const quantityVO = new Quantity(quantity, unitId)

    const availableBatches = await this.batchRepository.findAvailableByIngredient(ingredientIdVO)

    return this.fifoService.hasStock(availableBatches, quantityVO)
  }
}
