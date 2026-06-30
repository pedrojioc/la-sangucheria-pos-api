import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class FloorElementNotExist extends DomainException {
  constructor(id: string) {
    super(`Floor element with id ${id} does not exist`)
  }
}
