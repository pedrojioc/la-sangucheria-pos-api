import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

/**
 * Value Object for Product Image Storage Key
 *
 * Represents an abstract identifier in the file storage system.
 * This could be:
 * - Cloudflare Image ID (e.g., "2cdc28f0-017a-49c4-9ed7-87056c83901")
 * - AWS S3 key (e.g., "products/2024/image-123.jpg")
 * - Local filesystem path (e.g., "images/1234567890-abc.jpg")
 *
 * The domain doesn't care about the specific format - it's an opaque identifier.
 */
export class ProductImageStorageKey extends StringValueObject {
  private static readonly MAX_LENGTH = 255

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidArgument('Product image storage key cannot be empty')
    }

    if (value.length > ProductImageStorageKey.MAX_LENGTH) {
      throw new InvalidArgument(
        `Product image storage key cannot exceed ${ProductImageStorageKey.MAX_LENGTH} characters. Got: ${value.length}`
      )
    }
  }
}
