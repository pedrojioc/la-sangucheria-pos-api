import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class CustomerPhoneAlreadyExists extends BusinessRuleViolationException {
  constructor(phone: string) {
    super(`A customer with phone ${phone} already exists`)
  }
}
