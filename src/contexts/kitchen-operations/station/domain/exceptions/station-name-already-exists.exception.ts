import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class StationNameAlreadyExists extends BusinessRuleViolationException {
  constructor(name: string) {
    super(`A station with the name "${name}" already exists`)
  }
}
