import { Money } from '@/shared/domain/value-objects/money'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { CheckIngredientStock } from '@contexts/inventory/stock-level/application/check-stock/check-ingredient-stock'

import { InventoryStrategy } from './inventory-strategy'
import { ProductId } from '../product-id'

/**
 * Estrategia de inventario directo
 *
 * Para productos de reventa (retail) que se venden tal cual.
 * Al deducir, descuenta directamente del stock del producto.
 *
 * Ejemplo: "Coca-Cola 500ml" se vende sin preparación.
 * Al vender 1 Coca-Cola, descuenta 1 unidad del inventario de ese producto.
 *
 * NOTA: Internamente usa el mismo sistema de batches que los ingredientes.
 * Los productos retail son tratados como "ingredientes" que no se transforman.
 * Esto permite FIFO unificado y simplifica el modelo.
 */
export class DirectInventory extends InventoryStrategy {
  constructor(
    private readonly productId: ProductId,
    private readonly deductIngredient: DeductIngredient,
    private readonly getIngredientFifoCost: GetIngredientFifoCost,
    private readonly checkIngredientStock: CheckIngredientStock,
    private readonly unitId: string = 'unit' // Productos retail típicamente en "unidades"
  ) {
    super()
  }

  async deduct(quantity: number): Promise<void> {
    await this.deductIngredient.run(
      this.productId.value, // Usamos productId como si fuera ingredientId
      quantity,
      this.unitId,
      `Venta de producto retail`,
      null, // referenceId
      null // performedBy
    )
  }

  async hasStock(quantity: number): Promise<boolean> {
    return this.checkIngredientStock.run(this.productId.value, quantity, this.unitId)
  }

  async calculateCost(quantity: number): Promise<Money> {
    return this.getIngredientFifoCost.run(this.productId.value, quantity, this.unitId)
  }

  getProductId(): ProductId {
    return this.productId
  }
}
