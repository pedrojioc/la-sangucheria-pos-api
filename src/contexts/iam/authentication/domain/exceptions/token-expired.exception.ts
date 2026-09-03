import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class TokenExpired extends BusinessRuleViolationException {
  constructor() {
    super('Token has expired')
  }
}
