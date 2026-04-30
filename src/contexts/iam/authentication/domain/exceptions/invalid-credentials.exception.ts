import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidCredentials extends BusinessRuleViolationException {
  constructor() {
    super('Invalid username or password')
  }
}
