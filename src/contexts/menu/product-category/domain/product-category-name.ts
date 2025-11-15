import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductCategoryName extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsNotEmpty(value)
    this.ensureLengthIsLessThan50(value)
  }

  private ensureIsNotEmpty(value: string): void {
    if (value.length === 0) {
      throw new InvalidArgument('Category name cannot be empty')
    }
  }

  private ensureLengthIsLessThan50(value: string): void {
    if (value.length > 50) {
      throw new InvalidArgument('Category name cannot exceed 50 characters')
    }
  }
}
