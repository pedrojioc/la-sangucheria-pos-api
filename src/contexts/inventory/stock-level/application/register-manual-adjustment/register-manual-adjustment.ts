import { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '../../domain/repositories/inventory-level.repository'
import { InventoryMovement } from '../../domain/inventory-movement'
import { MovementType } from '../../domain/movement-type'
import { InventoryMovementCreatedEvent } from '../../domain/events/inventory-movement-created.event'
import { GetIngredientFifoCost } from '../get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { EventBus } from '@/shared/domain/events'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'

/**
 * RegisterManualAdjustment - Use Case
 *
 * Registra un ajuste manual de inventario originado desde el frontend.
 * Solo soporta movimientos de deducción: ADJUSTMENT y WASTE.
 *
 * El costo unitario se calcula automáticamente usando el costo FIFO actual
 * del ingrediente, para mantener la contabilidad de costos correcta.
 * Si no hay lotes disponibles (stock en 0), el costo se registra como 0.
 *
 * Toda entrada de stock debe pasar por una recepción de orden de compra
 * para garantizar trazabilidad de costos y lotes (FIFO).
 *
 * Publica InventoryMovementCreatedEvent para que el subscriber
 * UpdateInventoryLevelOnInventoryMovementCreated actualice el nivel de stock.
 */
export class RegisterManualAdjustment {
  constructor(
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository,
    private readonly fifoCost: GetIngredientFifoCost,
    private readonly eventBus: EventBus
  ) {}

  async run(
    ingredientId: string,
    type: MovementType.ADJUSTMENT | MovementType.WASTE,
    quantity: number,
    note: string | null,
    performedBy: string | null
  ): Promise<string> {
    const movementId = Uuid.random().value

    const level = await this.levelRepository.findByIngredient(new IngredientId(ingredientId))
    if (!level) {
      throw new Error(`No inventory level found for ingredient ${ingredientId}`)
    }
    const unitId = level.getCurrentQuantity().unitId

    const fifoTotal = await this.fifoCost.run(ingredientId, quantity, unitId).catch(() => null)
    const unitCost = fifoTotal ? fifoTotal.amount / quantity : 0
    const currency = fifoTotal ? fifoTotal.currency : 'COP'

    const movement = InventoryMovement.create(
      movementId,
      ingredientId,
      type,
      quantity,
      unitId,
      unitCost,
      currency,
      null,
      note,
      null,
      performedBy
    )

    await this.movementRepository.save(movement)

    await this.eventBus.publish([
      new InventoryMovementCreatedEvent({
        movementId: movement.id.value,
        ingredientId: movement.ingredientId.value,
        batchId: null,
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
    ])

    return movementId
  }
}
