import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class StationDisplayOrder extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidValueObjectException('Display order must be a non-negative integer')
    }
  }
}
