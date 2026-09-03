import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidTaxRate extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
