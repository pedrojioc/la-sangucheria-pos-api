import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'
import { OrderStatus } from '../order-status'

export class OrderCannotBeModified extends BusinessRuleViolationException {
  constructor(status: OrderStatus) {
    super(`La orden en estado ${status} no puede ser modificada`)
  }
}
