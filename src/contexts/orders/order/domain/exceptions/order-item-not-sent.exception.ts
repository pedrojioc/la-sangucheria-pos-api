import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemNotSent extends BusinessRuleViolationException {
  constructor(itemId: string) {
    super(`El ítem de orden ${itemId} no ha sido enviado a cocina`)
  }
}
