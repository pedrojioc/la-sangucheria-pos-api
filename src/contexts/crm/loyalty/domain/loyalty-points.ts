import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class LoyaltyPoints extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (value < 0) throw new InvalidArgument('Loyalty points cannot be negative')
  }
}
