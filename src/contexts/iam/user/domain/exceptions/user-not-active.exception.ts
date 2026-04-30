import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class UserNotActive extends BusinessRuleViolationException {
  constructor() {
    super('User account is not active')
  }
}
