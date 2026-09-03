import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class CannotDeductFromExhaustedBatchException extends BusinessRuleViolationException {
  constructor() {
    super('Cannot deduct from exhausted batch')
  }
}
