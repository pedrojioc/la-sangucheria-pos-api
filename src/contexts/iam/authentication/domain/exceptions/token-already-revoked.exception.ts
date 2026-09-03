import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class TokenAlreadyRevoked extends BusinessRuleViolationException {
  constructor() {
    super('Token has already been revoked')
  }
}
