import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class TokenTheftDetected extends DomainException {
  constructor(userId: string) {
    super(`Token theft detected for user ${userId}. All tokens have been revoked.`)
  }
}
