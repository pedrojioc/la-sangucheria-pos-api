import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'

export class PreparationRecipeIngredient {
  constructor(
    public readonly id: string,
    public readonly ingredientId: IngredientId,
    public readonly quantityPerUnit: Quantity
  ) {}

  scale(baseQuantity: number): Quantity {
    return this.quantityPerUnit.multiply(baseQuantity)
  }

  toPrimitives(): {
    id: string
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  } {
    return {
      id: this.id,
      ingredientId: this.ingredientId.value,
      quantityPerUnit: this.quantityPerUnit.value,
      unitId: this.quantityPerUnit.unitId
    }
  }

  static fromPrimitives(primitives: {
    id: string
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  }): PreparationRecipeIngredient {
    return new PreparationRecipeIngredient(
      primitives.id,
      new IngredientId(primitives.ingredientId),
      new Quantity(primitives.quantityPerUnit, primitives.unitId)
    )
  }
}
