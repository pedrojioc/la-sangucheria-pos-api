import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { FifoInventoryService } from '@contexts/inventory/batch/domain/services/fifo-inventory.service'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { EventBus } from '@/shared/domain/events/event-bus'

/**
 * DeductIngredient - Use Case
 *
 * Deduce cantidad de un ingrediente usando FIFO.
 * Este caso de uso es usado por RecipeBasedInventory strategy.
 *
 * Proceso:
 * 1. Obtener batches disponibles del ingrediente (ordenados FIFO)
 * 2. Deducir usando FifoInventoryService
 * 3. Guardar batches actualizados
 * 4. Registrar movimientos (uno por batch consumido)
 * 5. Actualizar InventoryLevel
 */
export class DeductIngredient {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository,
    private readonly fifoService: FifoInventoryService,
    private readonly eventBus: EventBus
  ) {}

  async run(
    ingredientId: string,
    quantity: number,
    unitId: string,
    reason: string | null = null,
    referenceId: string | null = null,
    performedBy: string | null = null
  ): Promise<void> {
    const ingredientIdVO = new IngredientId(ingredientId)
    const quantityVO = new Quantity(quantity, unitId)

    // 1. Obtener batches disponibles (FIFO)
    const availableBatches = await this.batchRepository.findAvailableByIngredient(ingredientIdVO)

    if (availableBatches.length === 0) {
      throw new Error(`No available batches for ingredient ${ingredientId}`)
    }

    // 2. Deducir usando FIFO
    const deductionResult = this.fifoService.deduct(availableBatches, quantityVO)

    // 3. Guardar batches actualizados
    for (const batch of availableBatches) {
      await this.batchRepository.save(batch)
    }

    // 4. Registrar movimientos (uno por batch consumido)
    for (const batchDeduction of deductionResult.batches) {
      const movementId = Uuid.random().value
      const movement = InventoryMovement.create(
        movementId,
        ingredientId,
        MovementType.SALE,
        batchDeduction.quantityDeducted,
        unitId,
        batchDeduction.unitCost,
        deductionResult.currency,
        batchDeduction.batchId,
        reason ?? 'Deducción de ingrediente',
        referenceId,
        performedBy
      )

      await this.movementRepository.save(movement)
    }

    // 5. Actualizar InventoryLevel
    const level = await this.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      throw new Error(`Inventory level not found for ingredient ${ingredientId}`)
    }

    level.decrease(quantityVO)
    await this.levelRepository.save(level)

    // 6. Publish domain events from InventoryLevel (LowStock, OutOfStock)
    const events = level.pullDomainEvents()
    if (events.length > 0) {
      await this.eventBus.publish(events)
    }
  }
}
