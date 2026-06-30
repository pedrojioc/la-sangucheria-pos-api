import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemNotExist extends BusinessRuleViolationException {
  constructor(itemId: string) {
    super(`Item de orden con id ${itemId} no existe`)
  }
}
