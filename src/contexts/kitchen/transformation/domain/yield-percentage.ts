import { NumberValueObject } from '@/shared/domain/value-objects'

/**
 * YieldPercentage - Value Object
 *
 * Representa el porcentaje de rendimiento de una transformación.
 * Ejemplo: 50% significa que de 5kg de materia prima obtengo 2.5kg de producto final.
 *
 * El resto (50%) es desperdicio (waste).
 */
export class YieldPercentage extends NumberValueObject {
  constructor(public readonly value: number) {
    super(value)
    this.ensureIsValidPercentage(value)
  }

  private ensureIsValidPercentage(value: number): void {
    if (value <= 0 || value > 100) {
      throw new Error('Yield percentage must be between 0 and 100')
    }
  }

  /**
   * Calcula la cantidad resultante aplicando el yield
   * Ejemplo: 5kg × 50% = 2.5kg
   */
  applyTo(quantity: number): number {
    return quantity * (this.value / 100)
  }

  /**
   * Calcula el porcentaje de desperdicio
   * Ejemplo: 50% yield → 50% waste
   */
  getWastePercentage(): number {
    return 100 - this.value
  }
}
