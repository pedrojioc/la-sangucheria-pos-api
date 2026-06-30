import { Money } from '@shared/domain/value-objects/money'
import { TaxType } from './tax-type'
import { InvalidTaxRate } from './exceptions/invalid-tax-rate.exception'

export interface TaxBreakdown {
  taxBase: Money
  taxAmount: Money
}

export interface TaxConfigPrimitives {
  rate: number
  type: TaxType
  inclusive: boolean
}

export class TaxConfig {
  private constructor(
    public readonly rate: number,
    public readonly type: TaxType,
    public readonly inclusive: boolean
  ) {
    this.ensureRateIsValid(rate)
  }

  static create(rate: number, type: TaxType, inclusive: boolean): TaxConfig {
    return new TaxConfig(rate, type, inclusive)
  }

  static defaultColombia(): TaxConfig {
    return new TaxConfig(0.08, TaxType.INC, true)
  }

  extractTax(netTotal: Money): TaxBreakdown {
    if (this.type === TaxType.EXEMPT || this.rate === 0) {
      return {
        taxBase: netTotal,
        taxAmount: new Money(0, netTotal.currency)
      }
    }

    const taxBaseRaw = netTotal.amount / (1 + this.rate)
    const taxBase = new Money(Math.round(taxBaseRaw * 100) / 100, netTotal.currency)
    const taxAmount = new Money(
      Math.round((netTotal.amount - taxBase.amount) * 100) / 100,
      netTotal.currency
    )

    return { taxBase, taxAmount }
  }

  toPrimitives(): TaxConfigPrimitives {
    return {
      rate: this.rate,
      type: this.type,
      inclusive: this.inclusive
    }
  }

  static fromPrimitives(primitives: TaxConfigPrimitives): TaxConfig {
    return new TaxConfig(primitives.rate, primitives.type, primitives.inclusive)
  }

  private ensureRateIsValid(rate: number): void {
    if (rate < 0) {
      throw new InvalidTaxRate('Tax rate cannot be negative')
    }
    if (rate > 1) {
      throw new InvalidTaxRate('Tax rate must be expressed as a decimal (e.g., 0.08 for 8%)')
    }
  }
}
