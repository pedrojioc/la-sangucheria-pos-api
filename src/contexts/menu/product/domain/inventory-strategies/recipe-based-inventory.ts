import { Money } from '@/shared/domain/value-objects/money'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { CheckIngredientStock } from '@contexts/inventory/stock-level/application/check-stock/check-ingredient-stock'

import { InventoryStrategy } from './inventory-strategy'
import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'

/**
 * Estrategia de inventario basada en recetas
 *
 * Para productos preparados que usan ingredientes.
 * Al deducir, descuenta cada ingrediente de la receta del inventario.
 *
 * Ejemplo: "Sanguche de la Casa" usa 150g de Morro Preparado, 2 panes, etc.
 * Al vender 1 sanguche, descuenta esas cantidades del inventario de ingredientes.
 */
export class RecipeBasedInventory extends InventoryStrategy {
  constructor(
    private readonly recipe: Recipe,
    private readonly deductIngredient: DeductIngredient,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly checkIngredientStock: CheckIngredientStock
  ) {
    super()
  }

  async deduct(quantity: number): Promise<void> {
    const scaledItems = this.recipe.scaleByQuantity(quantity)

    for (const item of scaledItems) {
      await this.deductIngredient.run(
        item.ingredientId.value,
        item.quantity.value,
        item.quantity.unitId,
        `Venta de producto con receta`,
        null, // referenceId (podría ser el ID de la venta)
        null // performedBy
      )
    }
  }

  async hasStock(quantity: number): Promise<boolean> {
    const scaledItems = this.recipe.scaleByQuantity(quantity)

    for (const item of scaledItems) {
      const hasStock = await this.checkIngredientStock.run(
        item.ingredientId.value,
        item.quantity.value,
        item.quantity.unitId
      )

      if (!hasStock) {
        return false
      }
    }

    return true
  }

  async calculateCost(quantity: number): Promise<Money> {
    const scaledItems = this.recipe.scaleByQuantity(quantity)
    let totalCost: Money | null = null

    for (const item of scaledItems) {
      const cost = await this.getIngredientFifoCost.run(
        item.ingredientId.value,
        item.quantity.value,
        item.quantity.unitId
      )

      totalCost = totalCost ? totalCost.add(cost) : cost
    }

    if (!totalCost) {
      throw new Error('Recipe has no items')
    }

    return totalCost
  }

  getRecipe(): Recipe {
    return this.recipe
  }
}
