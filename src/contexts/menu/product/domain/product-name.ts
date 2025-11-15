import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductName extends StringValueObject {
  private static readonly MAX_LENGTH = 100

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidArgument('Product name cannot be empty')
    }

    if (value.length > ProductName.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product name cannot exceed ${ProductName.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }
  }
}
