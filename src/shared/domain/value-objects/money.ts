import { NumberValueObject } from './number'
import { MONEY_CURRENCIES } from './currency'
import {
  InvalidValueObjectException,
  BusinessRuleViolationException
} from '@shared/domain/exceptions/domain.exception'

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'COP'
  ) {
    this.ensureIsValidCurrency(currency)
    this.ensureIsValidAmount(amount)
  }

  getAmount(): number {
    return this.amount
  }

  getCurrency(): string {
    return this.currency
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new BusinessRuleViolationException('Cannot add money with different currencies')
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new BusinessRuleViolationException('Cannot subtract money with different currencies')
    }
    const result = this.amount - other.amount
    if (result < 0) {
      throw new BusinessRuleViolationException('Cannot have negative money amount')
    }
    return new Money(result, this.currency)
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new BusinessRuleViolationException('Cannot multiply money by negative number')
    }
    return new Money(this.amount * multiplier, this.currency)
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new BusinessRuleViolationException('Cannot divide money by zero')
    }
    if (divisor < 0) {
      throw new BusinessRuleViolationException('Cannot divide money by negative number')
    }
    return new Money(this.amount / divisor, this.currency)
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }

  toString(): string {
    return `${this.amount} ${this.currency}`
  }

  private ensureIsValidCurrency(currency: string): void {
    if (!(MONEY_CURRENCIES as readonly string[]).includes(currency)) {
      throw new InvalidValueObjectException(
        `Currency must be one of ${MONEY_CURRENCIES.join(', ')}`
      )
    }
  }
  private ensureIsValidAmount(amount: number): void {
    if (amount < 0) {
      throw new InvalidValueObjectException('Money amount cannot be negative')
    }
  }
}
