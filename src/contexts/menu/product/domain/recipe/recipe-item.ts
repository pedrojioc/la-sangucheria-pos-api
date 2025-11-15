import { Quantity } from '@/shared/domain/value-objects/quantity'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export class RecipeItem {
  constructor(
    public readonly ingredientId: IngredientId,
    public readonly quantity: Quantity
  ) {}

  static create(ingredientId: string, quantityValue: number, unitId: string): RecipeItem {
    return new RecipeItem(new IngredientId(ingredientId), new Quantity(quantityValue, unitId))
  }

  multiplyBy(multiplier: number): RecipeItem {
    return new RecipeItem(this.ingredientId, this.quantity.multiply(multiplier))
  }

  equals(other: unknown): boolean {
    if (!(other instanceof RecipeItem)) {
      return false
    }
    return this.ingredientId.equals(other.ingredientId) && this.quantity.equals(other.quantity)
  }

  toPrimitives(): {
    ingredientId: string
    quantity: number
    unitId: string
  } {
    return {
      ingredientId: this.ingredientId.value,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId
    }
  }

  static fromPrimitives(data: {
    ingredientId: string
    quantity: number
    unitId: string
  }): RecipeItem {
    return new RecipeItem(
      new IngredientId(data.ingredientId),
      new Quantity(data.quantity, data.unitId)
    )
  }
}
