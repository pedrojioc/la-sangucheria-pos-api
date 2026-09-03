import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OptionItemNotValidForProduct extends BusinessRuleViolationException {
  constructor(itemId: string) {
    super(`Option item <${itemId}> does not belong to any group assigned to this product`)
  }
}
