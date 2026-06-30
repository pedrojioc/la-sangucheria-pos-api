import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class TableOccupied extends BusinessRuleViolationException {
  constructor(id: string) {
    super(`La mesa ${id} está ocupada con una orden activa`)
  }
}
