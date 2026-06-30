import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidTaxRate extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
