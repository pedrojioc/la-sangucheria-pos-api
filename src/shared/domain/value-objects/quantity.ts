import {
  InvalidValueObjectException,
  BusinessRuleViolationException
} from '@shared/domain/exceptions/domain.exception'

export class Quantity {
  constructor(
    public readonly value: number,
    public readonly unitId: string
  ) {
    this.ensureIsValidValue(value)
    this.ensureIsValidUnitId(unitId)
  }

  add(other: Quantity): Quantity {
    this.ensureSameUnit(other)
    return new Quantity(this.value + other.value, this.unitId)
  }

  subtract(other: Quantity): Quantity {
    this.ensureSameUnit(other)
    const result = this.value - other.value
    if (result < 0) {
      throw new BusinessRuleViolationException('Cannot have negative quantity')
    }
    return new Quantity(result, this.unitId)
  }

  multiply(multiplier: number): Quantity {
    if (multiplier < 0) {
      throw new BusinessRuleViolationException('Cannot multiply quantity by negative number')
    }
    return new Quantity(this.value * multiplier, this.unitId)
  }

  divide(divisor: number): Quantity {
    if (divisor === 0) {
      throw new BusinessRuleViolationException('Cannot divide quantity by zero')
    }
    if (divisor < 0) {
      throw new BusinessRuleViolationException('Cannot divide quantity by negative number')
    }
    return new Quantity(this.value / divisor, this.unitId)
  }

  isGreaterThan(other: Quantity): boolean {
    this.ensureSameUnit(other)
    return this.value > other.value
  }

  isGreaterOrEqual(other: Quantity): boolean {
    this.ensureSameUnit(other)
    return this.value >= other.value
  }

  isLessThan(other: Quantity): boolean {
    this.ensureSameUnit(other)
    return this.value < other.value
  }

  isLessOrEqual(other: Quantity): boolean {
    this.ensureSameUnit(other)
    return this.value <= other.value
  }

  equals(other: Quantity): boolean {
    if (!(other instanceof Quantity)) {
      return false
    }
    return this.value === other.value && this.unitId === other.unitId
  }

  toString(): string {
    return `${this.value} ${this.unitId}`
  }

  toPrimitives(): { value: number; unitId: string } {
    return {
      value: this.value,
      unitId: this.unitId
    }
  }

  static fromPrimitives(data: { value: number; unitId: string }): Quantity {
    return new Quantity(data.value, data.unitId)
  }

  private ensureIsValidValue(value: number): void {
    if (value < 0) {
      throw new InvalidValueObjectException('Quantity value cannot be negative')
    }
    if (!Number.isFinite(value)) {
      throw new InvalidValueObjectException('Quantity value must be a finite number')
    }
  }

  private ensureIsValidUnitId(unitId: string): void {
    if (!unitId || unitId.trim().length === 0) {
      throw new InvalidValueObjectException('Unit ID cannot be empty')
    }
  }

  private ensureSameUnit(other: Quantity): void {
    if (this.unitId !== other.unitId) {
      throw new BusinessRuleViolationException(
        `Cannot operate on quantities with different units: ${this.unitId} vs ${other.unitId}`
      )
    }
  }
}
