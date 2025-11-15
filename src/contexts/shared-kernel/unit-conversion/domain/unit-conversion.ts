import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { UnitConversionId } from './unit-conversion-id'
import { ConversionFactor } from './conversion-factor'

export interface UnitConversionPrimitives {
  id: string
  fromUnitId: string
  toUnitId: string
  factor: number
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * UnitConversion - Aggregate Root
 *
 * Representa una regla de conversión entre dos unidades.
 * Las conversiones son direccionales: from → to
 *
 * Ejemplos:
 * - kg → g: factor = 1000 (1kg = 1000g)
 * - L → ml: factor = 1000 (1L = 1000ml)
 * - docena → unidades: factor = 12
 *
 * IMPORTANTE: Para conversiones bidireccionales, se crean dos registros:
 * - kg → g (factor: 1000)
 * - g → kg (factor: 0.001)
 *
 * Esto simplifica las búsquedas y evita cálculos complejos.
 */
export class UnitConversion extends AggregateRoot {
  private constructor(
    public readonly id: UnitConversionId,
    public readonly fromUnitId: string,
    public readonly toUnitId: string,
    private factor: ConversionFactor,
    private description: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
    this.ensureDifferentUnits()
  }

  static create(
    id: string,
    fromUnitId: string,
    toUnitId: string,
    factor: number,
    description: string | null = null
  ): UnitConversion {
    const now = new Date()

    return new UnitConversion(
      new UnitConversionId(id),
      fromUnitId,
      toUnitId,
      new ConversionFactor(factor),
      description,
      now,
      now
    )
  }

  /**
   * Convierte una cantidad usando esta regla
   * Ejemplo: 2kg con factor 1000 → 2000g
   */
  convert(quantity: number): number {
    return this.factor.convertTo(quantity)
  }

  /**
   * Actualiza el factor de conversión
   */
  updateFactor(newFactor: number): void {
    this.factor = new ConversionFactor(newFactor)
    this.updatedAt = new Date()
  }

  getFactor(): ConversionFactor {
    return this.factor
  }

  private ensureDifferentUnits(): void {
    if (this.fromUnitId === this.toUnitId) {
      throw new Error('From and to units must be different')
    }
  }

  toPrimitives(): UnitConversionPrimitives {
    return {
      id: this.id.value,
      fromUnitId: this.fromUnitId,
      toUnitId: this.toUnitId,
      factor: this.factor.value,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: UnitConversionPrimitives): UnitConversion {
    return new UnitConversion(
      new UnitConversionId(primitives.id),
      primitives.fromUnitId,
      primitives.toUnitId,
      new ConversionFactor(primitives.factor),
      primitives.description,
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
