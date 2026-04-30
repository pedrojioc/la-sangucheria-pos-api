/**
 * Movement Type Enum
 *
 * Define los tipos de movimientos de inventario:
 * - PURCHASE: Entrada por compra a proveedor (aumenta stock, requiere batchId)
 * - SALE: Salida por venta (disminuye stock)
 * - ADJUSTMENT: Ajuste manual por conteo físico (disminuye stock)
 * - WASTE: Merma o desperdicio (disminuye stock)
 * - TRANSFER: Transferencia entre ubicaciones (neutral en total)
 *
 * Nota: No existe ENTRY manual. Toda entrada de stock debe pasar por una
 * recepción de orden de compra para garantizar trazabilidad de costos y lotes.
 */
export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  TRANSFER = 'TRANSFER'
}
