import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class UnitSymbolTooLong extends DomainException {
  constructor() {
    super('Unit symbol cannot be longer than 10 characters')
  }
}
