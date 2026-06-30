import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupMustHaveItems extends DomainException {
  constructor() {
    super('Option group must have at least one item')
  }
}
