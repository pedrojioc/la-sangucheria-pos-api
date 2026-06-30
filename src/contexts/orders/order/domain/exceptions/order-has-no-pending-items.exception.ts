import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderHasNoPendingItems extends BusinessRuleViolationException {
  constructor() {
    super('La orden no tiene items en estado PENDING para enviar a cocina')
  }
}
