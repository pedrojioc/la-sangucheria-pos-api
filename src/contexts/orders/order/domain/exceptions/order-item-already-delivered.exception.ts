import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemAlreadyDelivered extends BusinessRuleViolationException {
  constructor(itemId: string) {
    super(`El ítem de orden ${itemId} ya fue entregado y no puede ser cancelado`)
  }
}
