import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupMustHaveItems extends InvalidValueObjectException {
  constructor() {
    super('Option group must have at least one item')
  }
}
