import { ValueObject } from './value-object'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class BooleanValueObject extends ValueObject<boolean> {
  constructor(value: boolean) {
    super(value)
    this.ensureIsBoolean(value)
  }

  private ensureIsBoolean(value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new InvalidArgument('Value must be a boolean')
    }
  }
}
