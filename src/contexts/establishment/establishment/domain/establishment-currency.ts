import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

// ISO 4217 currency codes are exactly 3 uppercase letters.
const ISO_4217_REGEX = /^[A-Z]{3}$/

export class EstablishmentCurrency extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValidCurrency(value)
  }

  private ensureIsValidCurrency(value: string): void {
    if (!ISO_4217_REGEX.test(value)) {
      throw new InvalidArgument(
        `<EstablishmentCurrency> expects a 3-letter ISO 4217 code, got <${value}>`
      )
    }
  }
}
