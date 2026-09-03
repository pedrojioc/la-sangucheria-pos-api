import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class TokenTheftDetected extends BusinessRuleViolationException {
  constructor(userId: string) {
    super(`Token theft detected for user ${userId}. All tokens have been revoked.`)
  }
}
