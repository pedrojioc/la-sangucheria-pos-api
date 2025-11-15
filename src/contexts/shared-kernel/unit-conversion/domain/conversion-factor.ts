import { NumberValueObject } from '@/shared/domain/value-objects'

/**
 * ConversionFactor - Value Object
 *
 * Representa el factor de conversión entre dos unidades.
 * Ejemplo: 1kg = 1000g → factor = 1000
 * Ejemplo: 1L = 1000ml → factor = 1000
 *
 * Reglas:
 * - El factor debe ser > 0
 * - Para convertir de fromUnit a toUnit: multiply by factor
 * - Para convertir de toUnit a fromUnit: divide by factor
 */
export class ConversionFactor extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsPositive(value)
  }

  private ensureIsPositive(value: number): void {
    if (value <= 0) {
      throw new Error('Conversion factor must be greater than zero')
    }
  }

  /**
   * Convierte una cantidad de fromUnit a toUnit
   * Ejemplo: convertir 2kg a gramos
   * fromQuantity: 2, factor: 1000 → result: 2000
   */
  convertTo(fromQuantity: number): number {
    return fromQuantity * this.value
  }

  /**
   * Convierte una cantidad de toUnit a fromUnit
   * Ejemplo: convertir 2000g a kg
   * toQuantity: 2000, factor: 1000 → result: 2
   */
  convertFrom(toQuantity: number): number {
    return toQuantity / this.value
  }

  /**
   * Obtiene el factor inverso
   * Útil para conversiones bidireccionales
   */
  inverse(): ConversionFactor {
    return new ConversionFactor(1 / this.value)
  }
}
