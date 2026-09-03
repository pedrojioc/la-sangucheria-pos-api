import { StringValueObject } from '@/shared/domain/value-objects/string'
import { UnitSymbolTooLong } from './exceptions/unit-symbol-too-long.exception'

export class UnitSymbol extends StringValueObject {
  private static readonly MAX_LENGTH = 10

  constructor(value: string) {
    super(value)
    this.ensureSymbolIsNotTooLong(value)
  }

  private ensureSymbolIsNotTooLong(value: string): void {
    if (value.length > UnitSymbol.MAX_LENGTH) {
      throw new UnitSymbolTooLong()
    }
  }
}
