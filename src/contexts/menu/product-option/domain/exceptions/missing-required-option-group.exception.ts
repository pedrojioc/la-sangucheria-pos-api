import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class MissingRequiredOptionGroup extends DomainException {
  constructor(groupName: string) {
    super(`Required option group "${groupName}" has not been selected`)
  }
}
