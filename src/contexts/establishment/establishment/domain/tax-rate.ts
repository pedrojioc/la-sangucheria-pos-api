import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class TaxRate extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureRateIsValid(value)
  }

  private ensureRateIsValid(value: number): void {
    if (value < 0 || value > 1) {
      throw new InvalidArgument(
        `<TaxRate> must be a decimal between 0 and 1 (e.g. 0.08 for 8%), got <${value}>`
      )
    }
  }
}
