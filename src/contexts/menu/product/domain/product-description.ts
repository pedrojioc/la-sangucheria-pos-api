import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductDescription extends StringValueObject {
  private static readonly MAX_LENGTH = 500

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length > ProductDescription.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product description cannot exceed ${ProductDescription.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }
  }
}
