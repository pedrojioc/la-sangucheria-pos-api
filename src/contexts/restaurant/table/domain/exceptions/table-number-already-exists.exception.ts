import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class TableNumberAlreadyExists extends BusinessRuleViolationException {
  constructor(number: string) {
    super(`Ya existe una mesa con el número "${number}"`)
  }
}
