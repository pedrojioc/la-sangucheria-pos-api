import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidUnitType extends InvalidValueObjectException {
  constructor() {
    super('Invalid unit type')
  }
}
