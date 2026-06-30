import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class TableInactive extends BusinessRuleViolationException {
  constructor(id: string) {
    super(`La mesa ${id} está inactiva`)
  }
}
