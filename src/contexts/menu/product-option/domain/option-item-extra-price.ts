import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class OptionItemExtraPrice extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (value < 0) {
      throw new InvalidValueObjectException('OptionItemExtraPrice cannot be negative')
    }
  }

  isZero(): boolean {
    return this.value === 0
  }
}
