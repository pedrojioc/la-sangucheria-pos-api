import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemNotPending extends BusinessRuleViolationException {
  constructor(itemId: string) {
    super(`El item ${itemId} no está en estado PENDING y no puede ser modificado`)
  }
}
