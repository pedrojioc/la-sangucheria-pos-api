import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class InvoiceNotRetryable extends BusinessRuleViolationException {
  constructor(status: string) {
    super(
      `Invoice cannot be retried because its current status is '${status}'. Only FAILED invoices can be retried.`
    )
    this.name = 'InvoiceNotRetryable'
  }
}
