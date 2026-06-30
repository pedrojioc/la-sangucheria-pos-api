import { Money } from '@/shared/domain/value-objects/money'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { CheckIngredientStock } from '@contexts/inventory/stock-level/application/check-stock/check-ingredient-stock'

import { InventoryStrategy } from './inventory-strategy'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export class DirectInventory extends InventoryStrategy {
  constructor(
    private readonly ingredientId: IngredientId,
    private readonly deductIngredient: DeductIngredient,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly checkIngredientStock: CheckIngredientStock,
    private readonly unitId: string = 'unit'
  ) {
    super()
  }

  async deduct(quantity: number): Promise<void> {
    await this.deductIngredient.run(
      this.ingredientId.value,
      quantity,
      this.unitId,
      `Venta de producto retail`,
      null,
      null
    )
  }

  async hasStock(quantity: number): Promise<boolean> {
    return this.checkIngredientStock.run(this.ingredientId.value, quantity, this.unitId)
  }

  async calculateCost(quantity: number): Promise<Money> {
    return this.getIngredientFifoCost.run(this.ingredientId.value, quantity, this.unitId)
  }

  getIngredientId(): IngredientId {
    return this.ingredientId
  }
}
