/**
 * Movement Type Enum
 *
 * Define los tipos de movimientos de inventario:
 * - PURCHASE: Entrada por compra (aumenta stock)
 * - SALE: Salida por venta (disminuye stock)
 * - ADJUSTMENT: Ajuste manual (puede aumentar o disminuir)
 * - WASTE: Merma o desperdicio (disminuye stock)
 * - TRANSFER: Transferencia entre ubicaciones (neutral en total)
 */
export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  TRANSFER = 'TRANSFER'
}
