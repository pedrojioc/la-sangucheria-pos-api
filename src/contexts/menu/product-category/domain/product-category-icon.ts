import { StringValueObject } from '@/shared/domain/value-objects/string'

export class ProductCategoryIcon extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureLengthIsLessThan50(value)
  }

  private ensureLengthIsLessThan50(value: string): void {
    if (value.length > 50) {
      throw new Error('Category icon cannot exceed 50 characters')
    }
  }
}
