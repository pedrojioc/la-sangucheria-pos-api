import { TransformationUnitOfWork } from '@contexts/kitchen/transformation/domain/transformation-unit-of-work'
import { IngredientTransformation } from '@contexts/kitchen/transformation/domain/ingredient-transformation'
import { InputUnitMismatchException } from '@contexts/kitchen/transformation/domain/exceptions/input-unit-mismatch.exception'
import { OutputUnitMismatchException } from '@contexts/kitchen/transformation/domain/exceptions/output-unit-mismatch.exception'
import { FindPreparationRecipe } from '@contexts/kitchen/transformation/application/find/find-preparation-recipe'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { FifoInventoryService } from '@contexts/inventory/batch/domain/services/fifo-inventory.service'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { Money } from '@/shared/domain/value-objects/money'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { NoStockAvailableException } from '@contexts/inventory/stock-level/domain/exceptions/no-stock-available.exception'
import { EventBus } from '@/shared/domain/events/event-bus'
import { IngredientTransformedEvent } from '@contexts/kitchen/transformation/domain/events/ingredient-transformed.event'
import { AbnormalWasteDetectedEvent } from '@contexts/kitchen/transformation/domain/events/abnormal-waste-detected.event'

export class RegisterTransformation {
  constructor(
    private readonly findRecipe: FindPreparationRecipe,
    private readonly findIngredient: FindIngredient,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly fifoService: FifoInventoryService,
    private readonly uow: TransformationUnitOfWork,
    private readonly eventBus: EventBus
  ) {}

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
    const recipe = await this.findRecipe.run(recipeId)

    const baseIngredientIdVO = recipe.getBaseIngredientId()
    const outputIngredientIdVO = recipe.getOutputIngredientId()

    // 2. Validar que las unidades coincidan con las del ingrediente
    const baseIngredient = await this.findIngredient.run(baseIngredientIdVO.value)
    const outputIngredient = await this.findIngredient.run(outputIngredientIdVO.value)

    const baseUnitId = baseIngredient.toPrimitives().unitId
    if (inputUnitId !== baseUnitId) {
      throw new InputUnitMismatchException(baseIngredientIdVO.value, baseUnitId, inputUnitId)
    }

    const outputUnitIdExpected = outputIngredient.toPrimitives().unitId
    if (outputUnitId !== outputUnitIdExpected) {
      throw new OutputUnitMismatchException(
        outputIngredientIdVO.value,
        outputUnitIdExpected,
        outputUnitId
      )
    }

    // 3. Escalar ingredientes según cantidad
    const scaled = recipe.scaleIngredients(inputQuantity)
    const recipePrimitives = recipe.toPrimitives()

    // 4. Calcular costos FIFO (solo lectura, antes de abrir la transacción)
    const baseCost = await this.getIngredientFifoCost.run(
      scaled.baseIngredientId,
      scaled.baseQuantity,
      inputUnitId
    )

    let additionalsCost = new Money(0, baseCost.currency)
    for (const additional of scaled.additionalIngredients) {
      const cost = await this.getIngredientFifoCost.run(
        additional.ingredientId,
        additional.quantity,
        additional.unitId
      )
      additionalsCost = additionalsCost.add(cost)
    }

    const totalCost = baseCost.add(additionalsCost)
    const outputUnitCost = totalCost.divide(outputQuantity)
    const wasteQuantity = inputQuantity - outputQuantity

    // 5. Ejecutar todas las escrituras en una sola transacción atómica
    await this.uow.commit(async uow => {
      // 5a. Deducir ingrediente base
      await this.deductIngredient(
        uow,
        scaled.baseIngredientId,
        scaled.baseQuantity,
        inputUnitId,
        `Transformación: ${recipePrimitives.name}`,
        transformationId,
        performedBy
      )

      // 5b. Deducir ingredientes adicionales
      for (const additional of scaled.additionalIngredients) {
        await this.deductIngredient(
          uow,
          additional.ingredientId,
          additional.quantity,
          additional.unitId,
          `Transformación: ${recipePrimitives.name} (adicional)`,
          transformationId,
          performedBy
        )
      }

      // 5c. Agregar stock producido
      await this.addProducedStock(
        uow,
        outputIngredientIdVO.value,
        outputQuantity,
        outputUnitId,
        outputUnitCost.amount,
        totalCost.currency,
        transformationId,
        `Transformación: ${recipePrimitives.name}`,
        performedBy
      )

      // 5d. Registrar transformación
      const transformation = IngredientTransformation.create(
        transformationId,
        recipeId,
        scaled.baseIngredientId,
        outputIngredientIdVO.value,
        inputQuantity,
        inputUnitId,
        outputQuantity,
        outputUnitId,
        wasteQuantity,
        baseCost.amount,
        additionalsCost.amount,
        totalCost.currency,
        performedBy,
        notes
      )
      await uow.transformationRepository.save(transformation)
    })

    // 6. Publicar eventos (fuera de la transacción — fire & forget)
    const actualYieldPercentage = (outputQuantity / inputQuantity) * 100
    const events: any[] = []

    if (recipe.hasAbnormalWaste(actualYieldPercentage)) {
      events.push(
        new AbnormalWasteDetectedEvent({
          transformationId,
          recipeId,
          recipeName: recipePrimitives.name,
          baseIngredientId: scaled.baseIngredientId,
          outputIngredientId: outputIngredientIdVO.value,
          inputQuantity,
          inputUnitId,
          expectedOutput: recipe.calculateExpectedOutput(inputQuantity),
          actualOutput: outputQuantity,
          outputUnitId,
          expectedWaste: recipe.calculateExpectedWaste(inputQuantity),
          actualWaste: wasteQuantity,
          yieldVariancePercentage: recipe.getYieldPercentage().value - actualYieldPercentage,
          performedAt: new Date(),
          performedBy
        })
      )
    }

    events.push(
      new IngredientTransformedEvent({
        transformationId,
        recipeId,
        baseIngredientId: scaled.baseIngredientId,
        outputIngredientId: outputIngredientIdVO.value,
        inputQuantity,
        inputUnitId,
        outputQuantity,
        outputUnitId,
        wasteQuantity,
        totalCost: totalCost.amount,
        outputUnitCost: outputUnitCost.amount,
        currency: totalCost.currency,
        performedAt: new Date(),
        performedBy
      })
    )

    await this.eventBus.publish(events)
  }

  private async deductIngredient(
    uow: TransformationUnitOfWork,
    ingredientId: string,
    quantity: number,
    unitId: string,
    reason: string,
    referenceId: string,
    performedBy: string | null
  ): Promise<void> {
    const ingredientIdVO = new IngredientId(ingredientId)
    const quantityVO = new Quantity(quantity, unitId)

    const availableBatches = await uow.batchRepository.findAvailableByIngredient(ingredientIdVO)
    if (availableBatches.length === 0) {
      throw new NoStockAvailableException(ingredientId)
    }

    const deductionResult = this.fifoService.deduct(availableBatches, quantityVO)

    for (const batch of availableBatches) {
      await uow.batchRepository.save(batch)
    }

    for (const batchDeduction of deductionResult.batches) {
      const movement = InventoryMovement.create(
        Uuid.random().value,
        ingredientId,
        MovementType.SALE,
        batchDeduction.quantityDeducted,
        unitId,
        batchDeduction.unitCost,
        deductionResult.currency,
        batchDeduction.batchId,
        reason,
        referenceId,
        performedBy
      )
      await uow.movementRepository.save(movement)
    }

    const level = await uow.levelRepository.findByIngredient(ingredientIdVO)
    if (!level) {
      throw new Error(`Inventory level not found for ingredient ${ingredientId}`)
    }
    level.decrease(quantityVO)
    await uow.levelRepository.save(level)
  }

  private async addProducedStock(
    uow: TransformationUnitOfWork,
    ingredientId: string,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    referenceId: string,
    reason: string,
    performedBy: string | null
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
    await uow.batchRepository.save(batch)

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
    await uow.movementRepository.save(movement)

    const ingredientIdVO = new IngredientId(ingredientId)
    let level = await uow.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      level = InventoryLevel.create(Uuid.random().value, ingredientId, quantity, unitId)
    } else {
      level.increase(new Quantity(quantity, unitId))
    }

    await uow.levelRepository.save(level)
  }
}
