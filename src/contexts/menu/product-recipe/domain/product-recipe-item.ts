import { Quantity } from '@shared/domain/value-objects/quantity'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export interface ProductRecipeItemPrimitives {
  ingredientId: string
  quantity: number
  unitId: string
}

export class ProductRecipeItem {
  constructor(
    public readonly ingredientId: IngredientId,
    public readonly quantity: Quantity
  ) {}

  static create(ingredientId: string, quantity: number, unitId: string): ProductRecipeItem {
    return new ProductRecipeItem(new IngredientId(ingredientId), new Quantity(quantity, unitId))
  }

  toPrimitives(): ProductRecipeItemPrimitives {
    return {
      ingredientId: this.ingredientId.value,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId
    }
  }

  static fromPrimitives(data: ProductRecipeItemPrimitives): ProductRecipeItem {
    return new ProductRecipeItem(
      new IngredientId(data.ingredientId),
      new Quantity(data.quantity, data.unitId)
    )
  }
}
