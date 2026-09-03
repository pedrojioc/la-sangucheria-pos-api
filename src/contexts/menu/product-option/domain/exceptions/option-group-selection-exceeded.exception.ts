import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupSelectionExceeded extends BusinessRuleViolationException {
  constructor(groupName: string, max: number) {
    super(`Option group "${groupName}" allows at most ${max} selection(s)`)
  }
}
