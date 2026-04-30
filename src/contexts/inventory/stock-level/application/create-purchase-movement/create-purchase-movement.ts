import { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository'
import { InventoryMovement } from '../../domain/inventory-movement'
import { MovementType } from '../../domain/movement-type'
import { InventoryMovementCreatedEvent } from '../../domain/events/inventory-movement-created.event'
import { EventBus } from '@/shared/domain/events'
import { Uuid } from '@/shared/domain/value-objects/uuid'

/**
 * CreatePurchaseMovement - Use Case
 *
 * Crea un movimiento de inventario tipo PURCHASE a partir de los datos de un batch.
 * Publica InventoryMovementCreatedEvent para que downstream actualice el InventoryLevel.
 */
export class CreatePurchaseMovement {
  constructor(
    private readonly movementRepository: InventoryMovementRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    ingredientId: string,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    batchId: string,
    referenceCode: string | null,
    purchaseDate: Date
  ): Promise<void> {
    const movement = InventoryMovement.create(
      Uuid.random().value,
      ingredientId,
      MovementType.PURCHASE,
      quantity,
      unitId,
      unitCost,
      currency,
      batchId,
      'Purchase registered',
      referenceCode,
      null,
      purchaseDate
    )

    await this.movementRepository.save(movement)

    const movementEvent = new InventoryMovementCreatedEvent({
      movementId: movement.id.value,
      ingredientId: movement.ingredientId.value,
      batchId: movement.batchId?.value ?? null,
      type: movement.type,
      quantity: movement.quantity.value,
      unitId: movement.quantity.unitId,
      unitCost: movement.unitCost.amount,
      currency: movement.unitCost.currency,
      totalCost: movement.totalCost.amount,
      reason: movement.reason,
      referenceId: movement.referenceId,
      performedBy: movement.performedBy,
      performedAt: movement.performedAt
    })

    await this.eventBus.publish([movementEvent])
  }
}
