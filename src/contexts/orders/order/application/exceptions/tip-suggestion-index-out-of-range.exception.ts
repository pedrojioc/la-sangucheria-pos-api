import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class TipSuggestionIndexOutOfRange extends BusinessRuleViolationException {
  constructor(index: number) {
    super(`Tip suggestion index <${index}> is out of range. Expected 0, 1, or 2.`)
  }
}
