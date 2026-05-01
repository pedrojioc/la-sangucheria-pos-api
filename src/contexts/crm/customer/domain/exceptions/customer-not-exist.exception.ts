import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class CustomerNotExist extends DomainException {
  constructor(id: string) {
    super(`Customer with id ${id} does not exist`)
  }
}
