import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductSku extends StringValueObject {
  private static readonly PATTERN = /^[A-Z]{3}-[A-Z]{3}-\d+$/
  private static readonly MAX_LENGTH = 20

  constructor(value: string) {
    super(value)
    this.ensureIsValidSku(value)
  }

  private ensureIsValidSku(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidArgument('Product SKU cannot be empty')
    }

    if (value.length > ProductSku.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product SKU cannot exceed ${ProductSku.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }

    if (!ProductSku.PATTERN.test(value)) {
      throw new InvalidArgument(
        `Product SKU must follow format {3-letters}-{3-letters}-{number} (e.g., SAN-ITA-1). Got: ${value}`
      )
    }
  }
}
