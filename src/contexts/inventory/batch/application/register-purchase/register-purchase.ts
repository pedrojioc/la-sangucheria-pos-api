import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovementRepository } from '@/contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryMovement } from '@/contexts/inventory/stock-level/domain/inventory-movement'
import { MovementType } from '@/contexts/inventory/stock-level/domain/movement-type'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { Uuid } from '@/shared/domain/value-objects/uuid'

/**
 * RegisterPurchase - Use Case
 *
 * Registra la compra de un ingrediente, creando:
 * 1. Un nuevo InventoryBatch (lote de compra con precio)
 * 2. Un InventoryMovement (registro de entrada)
 * 3. Actualiza InventoryLevel (aumenta stock actual)
 *
 * Esta es la entrada principal al sistema de inventario.
 */
export class RegisterPurchase {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository
  ) {}

  async run(
    batchId: string,
    ingredientId: string,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    purchaseDate: Date,
    expirationDate: Date | null = null,
    supplier: string | null = null,
    referenceCode: string | null = null,
    performedBy: string | null = null
  ): Promise<void> {
    // 1. Crear el batch (lote de compra)
    const batch = InventoryBatch.create(
      batchId,
      ingredientId,
      quantity,
      unitId,
      unitCost,
      currency,
      purchaseDate,
      expirationDate,
      supplier,
      referenceCode
    )

    await this.batchRepository.save(batch)

    // 2. Registrar el movimiento (entrada)
    // Debe escuchar el evento InventoryBatchCreated
    /*
    const movementId = Uuid.random().value
    const movement = InventoryMovement.create(
      movementId,
      ingredientId,
      MovementType.PURCHASE,
      quantity,
      unitId,
      unitCost,
      currency,
      batchId,
      `Compra de ingrediente`,
      referenceCode,
      performedBy,
      purchaseDate
    )

    await this.movementRepository.save(movement)
    */

    // 3. Actualizar o crear InventoryLevel
    // Debe escuchar el evento InventoryMovementCreated
    /*
    const ingredientIdVO = new IngredientId(ingredientId)
    let level = await this.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      // Primera compra de este ingrediente, crear nivel
      const levelId = Uuid.random().value
      level = InventoryLevel.create(levelId, ingredientId, quantity, unitId)
    } else {
      // Ya existe, aumentar stock
      level.increase(new Quantity(quantity, unitId))
    }

    await this.levelRepository.save(level)

    // TODO: Publicar evento IngredientPurchased
    */
  }
}
