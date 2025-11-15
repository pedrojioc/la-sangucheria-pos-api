import { StringValueObject } from '@/shared/domain/value-objects/string'
import { UnitNameTooLong } from './exceptions/unit-name-too-long'

export class UnitName extends StringValueObject {
  private static readonly MAX_LENGTH = 50

  constructor(value: string) {
    super(value)
    this.ensureNameIsNotTooLong(value)
  }

  private ensureNameIsNotTooLong(value: string): void {
    if (value.length > UnitName.MAX_LENGTH) {
      throw new UnitNameTooLong()
    }
  }
}
