import { BusinessRuleViolationException } from '@/shared/domain/exceptions/domain.exception'

export class UserAlreadyExists extends BusinessRuleViolationException {
  constructor(field: 'username' | 'email', value: string) {
    super(`User with ${field} "${value}" already exists`)
  }
}
