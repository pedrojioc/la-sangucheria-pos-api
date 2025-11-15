import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidUnitType extends DomainException {
  constructor() {
    super('Invalid unit type')
  }
}
