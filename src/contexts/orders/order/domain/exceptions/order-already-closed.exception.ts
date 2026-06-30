import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderAlreadyClosed extends BusinessRuleViolationException {
  constructor(orderId: string) {
    super(`La orden ${orderId} ya está cerrada`)
  }
}
