import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderTypeNotEnabled extends BusinessRuleViolationException {
  constructor(type: string) {
    super(`Order type <${type}> is not enabled for this establishment.`)
  }
}
