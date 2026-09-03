import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class MissingRequiredOptionGroup extends BusinessRuleViolationException {
  constructor(groupName: string) {
    super(`Required option group "${groupName}" has not been selected`)
  }
}
