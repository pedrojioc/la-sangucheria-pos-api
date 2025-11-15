import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class UnitNameTooLong extends DomainException {
  constructor() {
    super('Unit name cannot be longer than 50 characters')
  }
}
