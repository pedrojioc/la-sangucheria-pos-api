import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidDiscountValue extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
