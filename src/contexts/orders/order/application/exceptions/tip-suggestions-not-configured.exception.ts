import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class TipSuggestionsNotConfigured extends BusinessRuleViolationException {
  constructor() {
    super('Tip suggestions are not configured for this establishment.')
  }
}
