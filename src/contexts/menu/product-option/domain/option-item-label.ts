import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class OptionItemLabel extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidValueObjectException('OptionItemLabel cannot be empty')
    }
    if (value.length > 100) {
      throw new InvalidValueObjectException('OptionItemLabel cannot exceed 100 characters')
    }
  }
}
