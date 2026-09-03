import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class UnitNameTooLong extends InvalidValueObjectException {
  constructor() {
    super('Unit name cannot be longer than 50 characters')
  }
}
