import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class InvalidDiscountValue extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
