import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class ResolucionNumber extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (value < 0) {
      throw new InvalidArgument(`<ResolucionNumber> must be >= 0, got <${value}>`)
    }
  }
}
