import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class UnitSymbolTooLong extends InvalidValueObjectException {
  constructor() {
    super('Unit symbol cannot be longer than 10 characters')
  }
}
