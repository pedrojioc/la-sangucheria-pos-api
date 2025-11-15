import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

/**
 * Value Object for Product Image URL
 *
 * Represents the public URL where the product image can be accessed.
 * This could be a Cloudflare Images URL, S3 URL, or any other CDN URL.
 */
export class ProductImageUrl extends StringValueObject {
  private static readonly MAX_LENGTH = 500

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidArgument('Product image URL cannot be empty')
    }

    if (value.length > ProductImageUrl.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product image URL cannot exceed ${ProductImageUrl.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }

    // Validate URL format
    try {
      new URL(value)
    } catch {
      throw new InvalidArgument(`Invalid product image URL format: ${value}`)
    }
  }
}
