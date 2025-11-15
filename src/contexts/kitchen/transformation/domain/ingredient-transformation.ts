import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { Money } from '@/shared/domain/value-objects/money'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { TransformationId } from './transformation-id'
import { PreparationRecipeId } from './preparation-recipe-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'

export interface IngredientTransformationPrimitives {
  id: string
  recipeId: string
  baseIngredientId: string
  outputIngredientId: string
  inputQuantity: number
  inputUnitId: string
  outputQuantity: number
  outputUnitId: string
  wasteQuantity: number
  baseCost: number
  additionalsCost: number
  totalCost: number
  currency: string
  outputUnitCost: number // Costo por unidad del output (incluye waste)
  performedBy: string | null
  performedAt: Date
  notes: string | null
  createdAt: Date
}

/**
 * IngredientTransformation - Aggregate Root
 *
 * Registro INMUTABLE de una transformación de ingrediente realizada.
 * Captura toda la información del proceso de transformación.
 *
 * Ejemplo: Transformación de Morro Crudo a Morro Preparado
 * - Input: 5kg morro crudo ($50,000)
 * - Adicionales: cebollín, pimienta, sal ($2,000)
 * - Output: 2.5kg morro preparado
 * - Waste: 2.5kg (50%)
 * - Total cost: $52,000
 * - Unit cost output: $52,000 / 2.5kg = $20,800/kg
 *
 * El costo por unidad del output incluye:
 * - Costo del ingrediente base
 * - Costo de ingredientes adicionales
 * - Costo del desperdicio (distribuido en el output)
 */
export class IngredientTransformation extends AggregateRoot {
  private constructor(
    public readonly id: TransformationId,
    public readonly recipeId: PreparationRecipeId,
    public readonly baseIngredientId: IngredientId,
    public readonly outputIngredientId: IngredientId,
    private readonly inputQuantity: Quantity,
    private readonly outputQuantity: Quantity,
    private readonly wasteQuantity: Quantity,
    private readonly baseCost: Money,
    private readonly additionalsCost: Money,
    private readonly totalCost: Money,
    private readonly outputUnitCost: Money, // Costo ajustado por unidad
    public readonly performedBy: string | null,
    public readonly performedAt: Date,
    public readonly notes: string | null,
    public readonly createdAt: Date
  ) {
    super()
  }

  static create(
    id: string,
    recipeId: string,
    baseIngredientId: string,
    outputIngredientId: string,
    inputQuantity: number,
    inputUnitId: string,
    outputQuantity: number,
    outputUnitId: string,
    wasteQuantity: number,
    baseCost: number,
    additionalsCost: number,
    currency: string,
    performedBy: string | null = null,
    notes: string | null = null,
    performedAt: Date = new Date()
  ): IngredientTransformation {
    const inputQty = new Quantity(inputQuantity, inputUnitId)
    const outputQty = new Quantity(outputQuantity, outputUnitId)
    const wasteQty = new Quantity(wasteQuantity, inputUnitId)

    const baseCostMoney = new Money(baseCost, currency)
    const additionalsCostMoney = new Money(additionalsCost, currency)
    const totalCostMoney = baseCostMoney.add(additionalsCostMoney)

    // Calcular costo por unidad del output (incluye waste)
    const outputUnitCostMoney = totalCostMoney.divide(outputQuantity)

    return new IngredientTransformation(
      new TransformationId(id),
      new PreparationRecipeId(recipeId),
      new IngredientId(baseIngredientId),
      new IngredientId(outputIngredientId),
      inputQty,
      outputQty,
      wasteQty,
      baseCostMoney,
      additionalsCostMoney,
      totalCostMoney,
      outputUnitCostMoney,
      performedBy,
      performedAt,
      notes,
      new Date()
    )
  }

  getOutputUnitCost(): Money {
    return this.outputUnitCost
  }

  getOutputQuantity(): Quantity {
    return this.outputQuantity
  }

  getTotalCost(): Money {
    return this.totalCost
  }

  toPrimitives(): IngredientTransformationPrimitives {
    return {
      id: this.id.value,
      recipeId: this.recipeId.value,
      baseIngredientId: this.baseIngredientId.value,
      outputIngredientId: this.outputIngredientId.value,
      inputQuantity: this.inputQuantity.value,
      inputUnitId: this.inputQuantity.unitId,
      outputQuantity: this.outputQuantity.value,
      outputUnitId: this.outputQuantity.unitId,
      wasteQuantity: this.wasteQuantity.value,
      baseCost: this.baseCost.amount,
      additionalsCost: this.additionalsCost.amount,
      totalCost: this.totalCost.amount,
      currency: this.totalCost.currency,
      outputUnitCost: this.outputUnitCost.amount,
      performedBy: this.performedBy,
      performedAt: this.performedAt,
      notes: this.notes,
      createdAt: this.createdAt
    }
  }

  static fromPrimitives(
    primitives: IngredientTransformationPrimitives
  ): IngredientTransformation {
    return new IngredientTransformation(
      new TransformationId(primitives.id),
      new PreparationRecipeId(primitives.recipeId),
      new IngredientId(primitives.baseIngredientId),
      new IngredientId(primitives.outputIngredientId),
      new Quantity(primitives.inputQuantity, primitives.inputUnitId),
      new Quantity(primitives.outputQuantity, primitives.outputUnitId),
      new Quantity(primitives.wasteQuantity, primitives.inputUnitId),
      new Money(primitives.baseCost, primitives.currency),
      new Money(primitives.additionalsCost, primitives.currency),
      new Money(primitives.totalCost, primitives.currency),
      new Money(primitives.outputUnitCost, primitives.currency),
      primitives.performedBy,
      primitives.performedAt,
      primitives.notes,
      primitives.createdAt
    )
  }
}
