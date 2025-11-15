import { PreparationRecipeRepository } from '@contexts/kitchen/transformation/domain/repositories/preparation-recipe.repository'
import { IngredientTransformationRepository } from '@contexts/kitchen/transformation/domain/repositories/ingredient-transformation.repository'
import { PreparationRecipeId } from '@contexts/kitchen/transformation/domain/preparation-recipe-id'
import { IngredientTransformation } from '@contexts/kitchen/transformation/domain/ingredient-transformation'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { Money } from '@/shared/domain/value-objects/money'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { EventBus } from '@/shared/domain/events/event-bus'
import { IngredientTransformedEvent } from '@contexts/kitchen/transformation/domain/events/ingredient-transformed.event'
import { AbnormalWasteDetectedEvent } from '@contexts/kitchen/transformation/domain/events/abnormal-waste-detected.event'

/**
 * RegisterTransformation - Use Case
 *
 * Proceso completo de transformación de ingredientes:
 * 1. Obtener receta de preparación
 * 2. Deducir ingrediente base (FIFO)
 * 3. Deducir ingredientes adicionales (FIFO)
 * 4. Calcular costo total
 * 5. Crear batch del ingrediente transformado con costo ajustado
 * 6. Calcular varianza de rendimiento (esperado vs real)
 * 7. Emitir alerta si la varianza excede el threshold
 * 8. Registrar transformación
 * 9. Publicar eventos
 *
 * IMPORTANTE: Usuario ingresa cantidades REALES
 * - Input: Cantidad realmente usada (ej: 5kg morro crudo)
 * - Output: Cantidad realmente obtenida (ej: 2.3kg morro preparado)
 * - Sistema calcula merma: input - output = 2.7kg
 * - Sistema compara con rendimiento esperado de la receta
 * - Si la diferencia es significativa, genera alerta
 *
 * Ejemplo: Transformar 5kg morro crudo → morro preparado
 * - Usuario ingresa: 5kg input, 2.3kg output (real)
 * - Deduce 5kg morro crudo (FIFO)
 * - Deduce condimentos (cebollín, pimienta, etc.)
 * - Calcula costo total: $50.50
 * - Crea batch de 2.3kg morro preparado ($50.50 / 2.3kg = $21.96/kg)
 * - Merma real: 2.7kg (54%)
 * - Esperado: 2.5kg output (50% yield)
 * - Varianza: -8% → Si excede threshold, alerta
 */
export class RegisterTransformation {
  constructor(
    private readonly recipeRepository: PreparationRecipeRepository,
    private readonly transformationRepository: IngredientTransformationRepository,
    private readonly batchRepository: InventoryBatchRepository,
    private readonly movementRepository: InventoryMovementRepository,
    private readonly levelRepository: InventoryLevelRepository,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly deductIngredient: DeductIngredient,
    private readonly eventBus: EventBus
  ) {}

  // Threshold de varianza aceptable (%)
  private readonly YIELD_VARIANCE_THRESHOLD = 15

  async run(
    transformationId: string,
    recipeId: string,
    inputQuantity: number,
    inputUnitId: string,
    outputQuantity: number,
    outputUnitId: string,
    performedBy: string | null = null,
    notes: string | null = null
  ): Promise<void> {
    // 1. Obtener receta
    const recipe = await this.recipeRepository.search(new PreparationRecipeId(recipeId))

    if (!recipe) {
      throw new Error(`Preparation recipe ${recipeId} not found`)
    }

    // 2. Escalar ingredientes según cantidad
    const scaled = recipe.scaleIngredients(inputQuantity)

    // 3. Calcular costos FIFO del ingrediente base
    const baseCost = await this.getIngredientFifoCost.run(
      scaled.baseIngredientId,
      scaled.baseQuantity,
      inputUnitId
    )

    // 4. Deducir ingrediente base
    await this.deductIngredient.run(
      scaled.baseIngredientId,
      scaled.baseQuantity,
      inputUnitId,
      `Transformación: ${recipe.toPrimitives().name}`,
      transformationId,
      performedBy
    )

    // 5. Calcular costos y deducir ingredientes adicionales
    let additionalsCost = new Money(0, baseCost.currency)

    for (const additional of scaled.additionalIngredients) {
      // Calcular costo FIFO
      const cost = await this.getIngredientFifoCost.run(
        additional.ingredientId,
        additional.quantity,
        additional.unitId
      )

      additionalsCost = additionalsCost.add(cost)

      // Deducir
      await this.deductIngredient.run(
        additional.ingredientId,
        additional.quantity,
        additional.unitId,
        `Transformación: ${recipe.toPrimitives().name} (adicional)`,
        transformationId,
        performedBy
      )
    }

    // 6. Calcular merma real (basada en cantidades ingresadas por usuario)
    const wasteQuantity = inputQuantity - outputQuantity
    const totalCost = baseCost.add(additionalsCost)

    // 7. Calcular varianza de rendimiento y detectar anomalías
    const yieldVariance = recipe.calculateYieldVariance(inputQuantity, outputQuantity)
    const expectedOutput = recipe.calculateExpectedOutput(inputQuantity)
    const expectedWaste = recipe.calculateExpectedWaste(inputQuantity)
    const recipePrimitives = recipe.toPrimitives()

    // Lista de eventos a publicar
    const events: any[] = []

    // Si la varianza excede el threshold, crear evento de alerta
    if (Math.abs(yieldVariance) > this.YIELD_VARIANCE_THRESHOLD) {
      const abnormalWasteEvent = new AbnormalWasteDetectedEvent({
        transformationId,
        recipeId,
        recipeName: recipePrimitives.name,
        baseIngredientId: scaled.baseIngredientId,
        outputIngredientId: recipe.getOutputIngredientId().value,
        inputQuantity,
        inputUnitId,
        expectedOutput,
        actualOutput: outputQuantity,
        outputUnitId,
        expectedWaste,
        actualWaste: wasteQuantity,
        yieldVariancePercentage: yieldVariance,
        performedAt: new Date(),
        performedBy
      })
      events.push(abnormalWasteEvent)
    }

    // 8. Crear batch del ingrediente transformado
    const outputBatchId = Uuid.random().value
    const outputIngredientId = recipe.getOutputIngredientId().value

    // Costo por unidad del output (incluye desperdicio)
    const outputUnitCost = totalCost.divide(outputQuantity)

    const outputBatch = InventoryBatch.create(
      outputBatchId,
      outputIngredientId,
      outputQuantity,
      outputUnitId,
      outputUnitCost.amount,
      totalCost.currency,
      new Date(), // purchaseDate = ahora (fecha de transformación)
      null, // expirationDate
      null, // supplier
      `Transformación ${transformationId}` // referenceCode
    )

    await this.batchRepository.save(outputBatch)

    // 9. Registrar movimiento de entrada del output
    const movementId = Uuid.random().value
    const movement = InventoryMovement.create(
      movementId,
      outputIngredientId,
      MovementType.PURCHASE, // Entrada por transformación
      outputQuantity,
      outputUnitId,
      outputUnitCost.amount,
      totalCost.currency,
      outputBatchId,
      `Transformación: ${recipePrimitives.name}`,
      transformationId,
      performedBy
    )

    await this.movementRepository.save(movement)

    // 10. Actualizar nivel de inventario del output
    const outputIngredientIdVO = new IngredientId(outputIngredientId)
    let outputLevel = await this.levelRepository.findByIngredient(outputIngredientIdVO)

    if (!outputLevel) {
      const levelId = Uuid.random().value
      outputLevel = InventoryLevel.create(levelId, outputIngredientId, outputQuantity, outputUnitId)
    } else {
      outputLevel.increase(new Quantity(outputQuantity, outputUnitId))
    }

    await this.levelRepository.save(outputLevel)

    // 11. Registrar transformación con cantidades REALES
    const transformation = IngredientTransformation.create(
      transformationId,
      recipeId,
      scaled.baseIngredientId,
      outputIngredientId,
      inputQuantity,
      inputUnitId,
      outputQuantity, // ← Cantidad REAL ingresada por usuario
      outputUnitId,
      wasteQuantity, // ← Calculada: inputQuantity - outputQuantity
      baseCost.amount,
      additionalsCost.amount,
      totalCost.currency,
      performedBy,
      notes
    )

    await this.transformationRepository.save(transformation)

    // 12. Agregar evento principal de transformación
    const transformedEvent = new IngredientTransformedEvent({
      transformationId,
      recipeId,
      baseIngredientId: scaled.baseIngredientId,
      outputIngredientId,
      inputQuantity,
      inputUnitId,
      outputQuantity, // ← Cantidad REAL
      outputUnitId,
      wasteQuantity, // ← Merma REAL
      totalCost: totalCost.amount,
      outputUnitCost: outputUnitCost.amount,
      currency: totalCost.currency,
      performedAt: new Date(),
      performedBy
    })
    events.push(transformedEvent)

    // 13. Publicar todos los eventos (transformación + alerta si aplica)
    await this.eventBus.publish(events)
  }
}
