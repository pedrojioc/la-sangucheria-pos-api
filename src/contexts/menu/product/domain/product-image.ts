import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductImage extends StringValueObject {
  private static readonly MAX_LENGTH = 255

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidArgument('Product image URL cannot be empty')
    }

    if (value.length > ProductImage.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product image URL cannot exceed ${ProductImage.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }
  }
}
