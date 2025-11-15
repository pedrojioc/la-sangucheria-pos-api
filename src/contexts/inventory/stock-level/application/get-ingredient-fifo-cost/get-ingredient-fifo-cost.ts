import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { FifoInventoryService } from '@contexts/inventory/batch/domain/services/fifo-inventory.service'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { Money } from '@shared/domain/value-objects/money'

/**
 * GetIngredientFifoCost - Query Use Case
 *
 * Calcula el costo FIFO de una cantidad de ingrediente
 * SIN deducirlo (solo para consulta/preview).
 */
export class GetIngredientFifoCost {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly fifoService: FifoInventoryService
  ) {}

  async run(ingredientId: string, quantity: number, unitId: string): Promise<Money> {
    const ingredientIdVO = new IngredientId(ingredientId)
    const quantityVO = new Quantity(quantity, unitId)

    const availableBatches = await this.batchRepository.findAvailableByIngredient(ingredientIdVO)

    if (availableBatches.length === 0) {
      throw new Error(`No available batches for ingredient ${ingredientId}`)
    }

    return this.fifoService.calculateCost(availableBatches, quantityVO)
  }
}
