import { Money } from '@/shared/domain/value-objects/money'

/**
 * Strategy Pattern para manejo de inventario de productos
 *
 * Cada producto puede tener diferentes estrategias de inventario:
 * - RecipeBasedInventory: Productos preparados que descuentan ingredientes
 * - DirectInventory: Productos retail que descuentan stock directo
 */
export abstract class InventoryStrategy {
  /**
   * Deduce inventario según la estrategia
   * @param quantity Cantidad de producto a deducir
   */
  abstract deduct(quantity: number): Promise<void>

  /**
   * Verifica si hay stock disponible
   * @param quantity Cantidad a verificar
   */
  abstract hasStock(quantity: number): Promise<boolean>

  /**
   * Calcula el costo FIFO del producto
   * @param quantity Cantidad para calcular el costo
   */
  abstract calculateCost(quantity: number): Promise<Money>
}
