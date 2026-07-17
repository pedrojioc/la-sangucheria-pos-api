import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export const ESTABLISHMENT_CURRENCIES = ['COP', 'USD', 'MXN'] as const

export class EstablishmentCurrency extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValidCurrency(value)
  }

  private ensureIsValidCurrency(value: string): void {
    if (!(ESTABLISHMENT_CURRENCIES as readonly string[]).includes(value)) {
      throw new InvalidValueObjectException(
        `<EstablishmentCurrency> does not allow the value <${value}>. Valid values: ${ESTABLISHMENT_CURRENCIES.join(', ')}`
      )
    }
  }
}
