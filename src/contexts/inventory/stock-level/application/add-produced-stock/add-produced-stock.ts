import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { EventBus } from '@/shared/domain/events'

export class AddProducedStock {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    ingredientId: string,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    referenceId: string,
    reason: string,
    performedBy: string | null = null
  ): Promise<void> {
    const batchId = Uuid.random().value

    const batch = InventoryBatch.create(
      batchId,
      ingredientId,
      quantity,
      unitId,
      unitCost,
      currency,
      new Date(),
      null,
      null,
      referenceId
    )

    await this.batchRepository.save(batch)

    const movement = InventoryMovement.create(
      Uuid.random().value,
      ingredientId,
      MovementType.PURCHASE,
      quantity,
      unitId,
      unitCost,
      currency,
      batchId,
      reason,
      referenceId,
      performedBy
    )

    await this.movementRepository.save(movement)

    const ingredientIdVO = new IngredientId(ingredientId)
    let level = await this.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      level = InventoryLevel.create(Uuid.random().value, ingredientId, quantity, unitId)
    } else {
      level.increase(new Quantity(quantity, unitId))
    }

    await this.levelRepository.save(level)

    const events = level.pullDomainEvents()
    if (events.length > 0) {
      await this.eventBus.publish(events)
    }
  }
}
