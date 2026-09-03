import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { IngredientRepository } from '@/contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversionNotFound } from '@/contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'
import { EventBus } from '@/shared/domain/events'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { Uuid } from '@/shared/domain/value-objects/uuid'

/**
 * RegisterPurchase - Use Case
 *
 * Registra la compra de un ingrediente de forma atómica:
 *   1. Crea el InventoryBatch
 *   2. Crea el InventoryMovement (tipo PURCHASE)
 *   3. Actualiza el InventoryLevel
 *
 * TRANSACTION: this use case does NOT open a transaction. The caller is
 * expected to run inside an ambient transaction opened by
 * @UseInterceptors(TransactionInterceptor) on the triggering endpoint (or,
 * for the event-driven path, the transaction already open around the
 * publisher). All repositories here are TransactionalRepository and enlist
 * automatically via the ambient UnitOfWorkContext.
 *
 * EVENT PUBLICATION IS IN-TRANSACTION. Publishing inside run() (not after
 * a separate commit step) means any category-1 subscriber to the batch/level
 * events runs atomically with these writes. Do not move publish() outside
 * of run() or defer it — that would silently break atomicity.
 *
 * Conversión automática de unidades:
 *   Si la unidad de compra difiere de la unidad base del ingrediente, el sistema convierte.
 *   Ejemplo: compra 10 kg a $150,000/kg → guarda 10,000 g a $150/g
 */
export class RegisterPurchase {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly unitConversionRepository: UnitConversionRepository,
    private readonly batchRepository: InventoryBatchRepository,
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository,
    private readonly eventBus: EventBus
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
    referenceCode: string | null = null
  ): Promise<void> {
    const ingredient = await this.ingredientRepository.search(new IngredientId(ingredientId))

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with id '${ingredientId}' not found`)
    }

    const baseUnitId = ingredient.toPrimitives().unitId

    let finalQuantity = quantity
    let finalUnitId = unitId
    let finalUnitCost = unitCost

    if (unitId !== baseUnitId) {
      const converted = await this.convertToBaseUnit(quantity, unitId, baseUnitId, unitCost)
      finalQuantity = converted.convertedQuantity
      finalUnitId = converted.convertedUnitId
      finalUnitCost = converted.convertedUnitCost
    }

    const allEvents: any[] = []

    // 1. Batch
    const batch = InventoryBatch.create(
      batchId,
      ingredientId,
      finalQuantity,
      finalUnitId,
      finalUnitCost,
      currency,
      purchaseDate,
      expirationDate,
      supplier,
      referenceCode
    )
    await this.batchRepository.save(batch)
    allEvents.push(...batch.pullDomainEvents())

    // 2. Movement
    const movement = InventoryMovement.create(
      Uuid.random().value,
      ingredientId,
      MovementType.PURCHASE,
      finalQuantity,
      finalUnitId,
      finalUnitCost,
      currency,
      batchId,
      'Purchase registered',
      referenceCode,
      null,
      purchaseDate
    )
    await this.movementRepository.save(movement)

    // 3. Level
    const ingredientIdVO = new IngredientId(ingredientId)
    let level = await this.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      level = InventoryLevel.create(Uuid.random().value, ingredientId, 0, finalUnitId)
    }

    level.increase(new Quantity(finalQuantity, finalUnitId))
    await this.levelRepository.save(level)
    allEvents.push(...level.pullDomainEvents())

    // In-transaction publish. See class doc — do not move this.
    if (allEvents.length > 0) {
      await this.eventBus.publish(allEvents)
    }
  }

  private async convertToBaseUnit(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    unitCost: number
  ): Promise<{ convertedQuantity: number; convertedUnitId: string; convertedUnitCost: number }> {
    const conversionRule = await this.unitConversionRepository.findByUnits(fromUnitId, toUnitId)

    if (!conversionRule) {
      throw new UnitConversionNotFound(fromUnitId, toUnitId)
    }

    const factor = conversionRule.getFactor().value

    return {
      convertedQuantity: quantity * factor,
      convertedUnitId: toUnitId,
      convertedUnitCost: unitCost / factor
    }
  }
}
