import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { IngredientRepository } from '@/contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversionNotFound } from '@/contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'
import { EventBus } from '@/shared/domain/events'

/**
 * RegisterPurchase - Use Case
 *
 * Registra la compra de un ingrediente, creando un InventoryBatch.
 * Los movimientos e inventarios se actualizan via eventos (InventoryBatchCreatedEvent).
 *
 * IMPORTANTE: Conversión Automática de Unidades
 * ---------------------------------------------
 * Si la unidad de compra difiere de la unidad base del ingrediente,
 * el sistema convierte automáticamente:
 *
 * Ejemplo:
 * - Ingrediente "Lomo de res" tiene unidad base: gramos
 * - Compra: 10 kg a $150,000/kg
 * - Se convierte a: 10,000 g a $150/g
 * - El batch se guarda en gramos (unidad base)
 *
 * Esto garantiza:
 * - Consistencia en inventario (todo en unidad base)
 * - FIFO funciona sin problemas de conversión
 * - Recetas pueden consumir sin conversiones adicionales
 */
export class RegisterPurchase {
  constructor(
    private readonly batchRepository: InventoryBatchRepository,
    private readonly ingredientRepository: IngredientRepository,
    private readonly unitConversionRepository: UnitConversionRepository,
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
    // 1. Obtener el ingrediente para conocer su unidad base
    const ingredient = await this.ingredientRepository.search(new IngredientId(ingredientId))

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with id '${ingredientId}' not found`)
    }

    const ingredientPrimitives = ingredient.toPrimitives()
    const baseUnitId = ingredientPrimitives.unitId

    // 2. Convertir cantidad y costo si las unidades difieren
    let finalQuantity = quantity
    let finalUnitId = unitId
    let finalUnitCost = unitCost

    if (unitId !== baseUnitId) {
      const conversionResult = await this.convertToBaseUnit(quantity, unitId, baseUnitId, unitCost)

      finalQuantity = conversionResult.convertedQuantity
      finalUnitId = conversionResult.convertedUnitId
      finalUnitCost = conversionResult.convertedUnitCost
    }

    // 3. Crear el batch en la unidad base del ingrediente
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

    const events = batch.pullDomainEvents()
    await this.eventBus.publish(events)
  }

  /**
   * Convierte la cantidad y el costo unitario a la unidad base del ingrediente.
   *
   * Ejemplo:
   * - Input: 10 kg a $150,000/kg
   * - Output: 10,000 g a $150/g
   *
   * El factor de conversión se aplica:
   * - Cantidad: multiplicar por factor (10 × 1000 = 10,000)
   * - Costo: dividir por factor ($150,000 ÷ 1000 = $150)
   */
  private async convertToBaseUnit(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    unitCost: number
  ): Promise<{
    convertedQuantity: number
    convertedUnitId: string
    convertedUnitCost: number
  }> {
    // Buscar la regla de conversión
    const conversionRule = await this.unitConversionRepository.findByUnits(fromUnitId, toUnitId)

    if (!conversionRule) {
      throw new UnitConversionNotFound(fromUnitId, toUnitId)
    }

    // Obtener el factor de conversión
    const factor = conversionRule.getFactor().value

    // Convertir cantidad (multiplicar por factor)
    // Ejemplo: 10 kg × 1000 = 10,000 g
    const convertedQuantity = quantity * factor

    // Convertir costo unitario (dividir por factor)
    // Ejemplo: $150,000/kg ÷ 1000 = $150/g
    const convertedUnitCost = unitCost / factor

    return {
      convertedQuantity,
      convertedUnitId: toUnitId,
      convertedUnitCost
    }
  }
}
