import { StringValueObject } from '@/shared/domain/value-objects/string'

export class ProductCategoryDescription extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureLengthIsLessThan200(value)
  }

  private ensureLengthIsLessThan200(value: string): void {
    if (value.length > 200) {
      throw new Error('Category description cannot exceed 200 characters')
    }
  }
}
