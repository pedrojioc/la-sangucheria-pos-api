import { NumberValueObject } from '@/shared/domain/value-objects/number'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductPrice extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (value < 0) {
      throw new InvalidArgument(`Product price cannot be negative. Got: ${value}`)
    }

    // Validate maximum 2 decimal places
    const decimals = (value.toString().split('.')[1] || '').length
    if (decimals > 2) {
      throw new InvalidArgument(
        `Product price cannot have more than 2 decimal places. Got: ${decimals}`
      )
    }
  }
}
