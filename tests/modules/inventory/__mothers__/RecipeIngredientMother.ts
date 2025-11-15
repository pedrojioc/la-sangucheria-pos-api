import { RecipeItem } from '@contexts/kitchen/recipe/domain/recipe-item'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class RecipeIngredientMother {
  static create(params: Partial<{
    ingredientId: string
    quantity: number
    unitId: string
  }> = {}): RecipeItem {
    const ingredientId = params.ingredientId ?? UuidMother.random()
    const quantity = params.quantity ?? NumberMother.random({ min: 0.1, max: 10 })
    const unitId = params.unitId ?? UuidMother.random()

    return RecipeItem.create(ingredientId, quantity, unitId)
  }

  static random(): RecipeItem {
    return this.create()
  }

  static withIngredient(ingredientId: string, quantity: number): RecipeItem {
    return this.create({ ingredientId, quantity })
  }

  static withQuantity(quantity: number): RecipeItem {
    return this.create({ quantity })
  }
}
