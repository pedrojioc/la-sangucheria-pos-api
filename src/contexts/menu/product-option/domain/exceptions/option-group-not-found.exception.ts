import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupNotFound extends DomainException {
  constructor(id: string) {
    super(`Option group with id <${id}> does not exist`)
  }
}
