import { NumberValueObject } from '@/shared/domain/value-objects/number'

export class SupplierRating extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Rating must be an integer')
    }

    if (value < 1 || value > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
  }
}
