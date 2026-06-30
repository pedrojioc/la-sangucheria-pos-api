import { Money } from '@shared/domain/value-objects/money'
import { DiscountType } from './discount-type'
import { DiscountMethod } from './discount-method'
import { InvalidDiscountValue } from './exceptions/invalid-discount-value.exception'

export interface DiscountPrimitives {
  type: DiscountType
  method: DiscountMethod
  value: number
  reason: string | null
  appliedBy: string
}

export class Discount {
  private constructor(
    public readonly type: DiscountType,
    public readonly method: DiscountMethod,
    public readonly value: number,
    public readonly reason: string | null,
    public readonly appliedBy: string
  ) {
    this.ensureValueIsPositive(value)
    if (method === DiscountMethod.PERCENTAGE) {
      this.ensurePercentageInRange(value)
    }
  }

  static create(
    type: DiscountType,
    method: DiscountMethod,
    value: number,
    appliedBy: string,
    reason?: string | null
  ): Discount {
    return new Discount(type, method, value, reason ?? null, appliedBy)
  }

  amountOn(base: Money): Money {
    let raw: number

    if (this.method === DiscountMethod.PERCENTAGE) {
      raw = base.amount * (this.value / 100)
    } else {
      raw = this.value
    }

    const capped = Math.min(raw, base.amount)
    return new Money(Math.round(capped * 100) / 100, base.currency)
  }

  toPrimitives(): DiscountPrimitives {
    return {
      type: this.type,
      method: this.method,
      value: this.value,
      reason: this.reason,
      appliedBy: this.appliedBy
    }
  }

  static fromPrimitives(primitives: DiscountPrimitives): Discount {
    return new Discount(
      primitives.type,
      primitives.method,
      primitives.value,
      primitives.reason,
      primitives.appliedBy
    )
  }

  private ensureValueIsPositive(value: number): void {
    if (value <= 0) {
      throw new InvalidDiscountValue('Discount value must be positive')
    }
  }

  private ensurePercentageInRange(value: number): void {
    if (value > 100) {
      throw new InvalidDiscountValue('Percentage discount cannot exceed 100')
    }
  }
}
