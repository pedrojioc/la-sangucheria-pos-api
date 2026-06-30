import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class StationName extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) {
      throw new InvalidValueObjectException('Station name cannot be empty')
    }
    if (value.length > 50) {
      throw new InvalidValueObjectException('Station name cannot exceed 50 characters')
    }
  }
}
