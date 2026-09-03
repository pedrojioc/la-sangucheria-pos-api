import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class ZoneNameAlreadyExists extends BusinessRuleViolationException {
  constructor(name: string) {
    super(`Ya existe una zona con el nombre "${name}"`)
  }
}
