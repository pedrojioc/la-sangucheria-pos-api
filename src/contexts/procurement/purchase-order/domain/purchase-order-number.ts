import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidPurchaseOrderNumber } from './exceptions/invalid-purchase-order-number.exception'

/**
 * PurchaseOrderNumber - Value Object
 *
 * Número de orden de compra (ej: PO-2025-001)
 *
 * Formato: PO-{YEAR}-{SEQUENCE}
 * Ejemplos:
 * - PO-2025-001
 * - PO-2025-152
 */
export class PurchaseOrderNumber extends StringValueObject {
  private static readonly PATTERN = /^PO-\d{4}-\d{3,}$/
  private static readonly MAX_LENGTH = 20

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length > PurchaseOrderNumber.MAX_LENGTH) {
      throw new InvalidPurchaseOrderNumber(
        `Purchase order number cannot exceed ${PurchaseOrderNumber.MAX_LENGTH} characters`
      )
    }

    if (!PurchaseOrderNumber.PATTERN.test(value)) {
      throw new InvalidPurchaseOrderNumber(
        `Purchase order number must follow format PO-YYYY-NNN (e.g., PO-2025-001)`
      )
    }
  }

  /**
   * Genera un número de orden secuencial para el año actual
   */
  static generate(sequence: number): PurchaseOrderNumber {
    const year = new Date().getFullYear()
    const sequenceStr = sequence.toString().padStart(3, '0')
    return new PurchaseOrderNumber(`PO-${year}-${sequenceStr}`)
  }
}
