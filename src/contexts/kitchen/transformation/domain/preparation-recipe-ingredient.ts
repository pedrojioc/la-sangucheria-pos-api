import { ValueObject } from '@/shared/domain/value-objects/value-object'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'

/**
 * PreparationRecipeIngredient - Value Object
 *
 * Representa un ingrediente adicional usado durante la preparación.
 * Estos son ingredientes que se CONSUMEN durante la transformación
 * (ej: condimentos, especias, etc.)
 *
 * IMPORTANTE: Base por 1 unidad del ingrediente base.
 * Ejemplo: Si la receta dice "50g cebollín por 1kg morro",
 * entonces para 5kg de morro se usarán 250g de cebollín.
 */
export class PreparationRecipeIngredient {
  constructor(
    public readonly ingredientId: IngredientId,
    public readonly quantityPerUnit: Quantity // Cantidad por 1 unidad del ingrediente base
  ) {}

  /**
   * Escala la cantidad según la cantidad base a preparar
   * Ejemplo: 50g por 1kg × 5kg = 250g
   */
  scale(baseQuantity: number): Quantity {
    return this.quantityPerUnit.multiply(baseQuantity)
  }

  toPrimitives(): {
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  } {
    return {
      ingredientId: this.ingredientId.value,
      quantityPerUnit: this.quantityPerUnit.value,
      unitId: this.quantityPerUnit.unitId
    }
  }

  static fromPrimitives(primitives: {
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  }): PreparationRecipeIngredient {
    return new PreparationRecipeIngredient(
      new IngredientId(primitives.ingredientId),
      new Quantity(primitives.quantityPerUnit, primitives.unitId)
    )
  }
}
