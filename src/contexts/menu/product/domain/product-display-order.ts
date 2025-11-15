import { NumberValueObject } from '@/shared/domain/value-objects/number'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductDisplayOrder extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (value < 0) {
      throw new InvalidArgument(`Product display order cannot be negative. Got: ${value}`)
    }

    if (!Number.isInteger(value)) {
      throw new InvalidArgument(`Product display order must be an integer. Got: ${value}`)
    }
  }
}
