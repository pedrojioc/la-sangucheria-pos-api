import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class CannotDeductFromExhaustedBatchException extends DomainException {
  constructor() {
    super('Cannot deduct from exhausted batch')
  }
}
