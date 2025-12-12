import { StringValueObject } from '@/shared/domain/value-objects/string'

export class SupplierName extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length === 0) {
      throw new Error('Supplier name cannot be empty')
    }

    if (value.length > 200) {
      throw new Error('Supplier name cannot exceed 200 characters')
    }
  }
}
