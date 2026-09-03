import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class CustomerDocumentAlreadyExists extends BusinessRuleViolationException {
  constructor(type: string, number: string) {
    super(`A customer with document ${type} ${number} already exists`)
  }
}
