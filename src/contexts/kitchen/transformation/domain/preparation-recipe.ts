import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { PreparationRecipeId } from './preparation-recipe-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { PreparationRecipeIngredient } from './preparation-recipe-ingredient'
import { YieldPercentage } from './yield-percentage'

export interface PreparationRecipePrimitives {
  id: string
  name: string
  description: string | null
  baseIngredientId: string
  outputIngredientId: string
  yieldPercentage: number
  additionalIngredients: Array<{
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  }>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * PreparationRecipe - Aggregate Root
 *
 * Receta para transformar un ingrediente base en otro ingrediente.
 * Define los ingredientes adicionales necesarios y el rendimiento esperado.
 *
 * Ejemplo: "Receta de Morro Preparado"
 * - Base: Morro Crudo (1kg)
 * - Adicionales: 10g cebollín, 0.1g pimienta, 5g sal (por cada 1kg)
 * - Yield Esperado: 50% (normalmente de 1kg crudo obtengo 0.5kg preparado)
 * - Output: Morro Preparado
 *
 * IMPORTANTE: Base por 1 unidad (Alternativa A del diseño)
 * Las cantidades se escalan automáticamente según la cantidad a preparar.
 *
 * CRÍTICO: yieldPercentage es REFERENCIAL
 * - NO se usa para calcular el output real en transformaciones
 * - El usuario ingresa las cantidades reales de input y output
 * - Se usa para comparar rendimiento esperado vs real
 * - Se usa para generar alertas de rendimiento anormal
 */
export class PreparationRecipe extends AggregateRoot {
  private constructor(
    public readonly id: PreparationRecipeId,
    private name: string,
    private description: string | null,
    private readonly baseIngredientId: IngredientId,
    private readonly outputIngredientId: IngredientId,
    private readonly yieldPercentage: YieldPercentage,
    private additionalIngredients: PreparationRecipeIngredient[],
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    baseIngredientId: string,
    outputIngredientId: string,
    yieldPercentage: number,
    additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }> = [],
    description: string | null = null
  ): PreparationRecipe {
    const now = new Date()

    return new PreparationRecipe(
      new PreparationRecipeId(id),
      name,
      description,
      new IngredientId(baseIngredientId),
      new IngredientId(outputIngredientId),
      new YieldPercentage(yieldPercentage),
      additionalIngredients.map(item => PreparationRecipeIngredient.fromPrimitives(item)),
      true,
      now,
      now
    )
  }

  /**
   * Calcula todos los ingredientes necesarios para una cantidad específica
   * Ejemplo: Para preparar 5kg de morro crudo:
   * - Base: 5kg morro crudo
   * - Adicionales: 50g cebollín (10g × 5), 0.5g pimienta (0.1g × 5), etc.
   */
  scaleIngredients(baseQuantity: number): {
    baseIngredientId: string
    baseQuantity: number
    additionalIngredients: Array<{
      ingredientId: string
      quantity: number
      unitId: string
    }>
  } {
    return {
      baseIngredientId: this.baseIngredientId.value,
      baseQuantity,
      additionalIngredients: this.additionalIngredients.map(item => {
        const scaled = item.scale(baseQuantity)
        return {
          ingredientId: item.ingredientId.value,
          quantity: scaled.value,
          unitId: scaled.unitId
        }
      })
    }
  }

  /**
   * Calcula la cantidad de output ESPERADA dado una cantidad de base
   * IMPORTANTE: Este es un cálculo REFERENCIAL, no el output real
   * El output real lo ingresa el usuario basado en lo que realmente obtuvo
   * Ejemplo: 5kg morro crudo × 50% yield = 2.5kg morro preparado (esperado)
   * Uso: Comparar con output real, reportes, alertas
   */
  calculateExpectedOutput(baseQuantity: number): number {
    return this.yieldPercentage.applyTo(baseQuantity)
  }

  /**
   * Calcula el desperdicio ESPERADO
   * IMPORTANTE: Este es un cálculo REFERENCIAL, no la merma real
   * La merma real se calcula: inputQuantity - outputQuantity (real)
   * Uso: Comparar con merma real, reportes, alertas
   */
  calculateExpectedWaste(baseQuantity: number): number {
    return baseQuantity - this.calculateExpectedOutput(baseQuantity)
  }

  /**
   * Calcula la variación entre el output esperado y el real
   * Retorna el porcentaje de variación (positivo = más output del esperado, negativo = menos)
   * Ejemplo: esperado 2.5kg, real 2.3kg → -8%
   */
  calculateYieldVariance(baseQuantity: number, actualOutput: number): number {
    const expectedOutput = this.calculateExpectedOutput(baseQuantity)
    if (expectedOutput === 0) return 0
    return ((actualOutput - expectedOutput) / expectedOutput) * 100
  }

  getBaseIngredientId(): IngredientId {
    return this.baseIngredientId
  }

  getOutputIngredientId(): IngredientId {
    return this.outputIngredientId
  }

  getYieldPercentage(): YieldPercentage {
    return this.yieldPercentage
  }

  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  toPrimitives(): PreparationRecipePrimitives {
    return {
      id: this.id.value,
      name: this.name,
      description: this.description,
      baseIngredientId: this.baseIngredientId.value,
      outputIngredientId: this.outputIngredientId.value,
      yieldPercentage: this.yieldPercentage.value,
      additionalIngredients: this.additionalIngredients.map(item => item.toPrimitives()),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: PreparationRecipePrimitives): PreparationRecipe {
    return new PreparationRecipe(
      new PreparationRecipeId(primitives.id),
      primitives.name,
      primitives.description,
      new IngredientId(primitives.baseIngredientId),
      new IngredientId(primitives.outputIngredientId),
      new YieldPercentage(primitives.yieldPercentage),
      primitives.additionalIngredients.map(item =>
        PreparationRecipeIngredient.fromPrimitives(item)
      ),
      primitives.isActive,
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
