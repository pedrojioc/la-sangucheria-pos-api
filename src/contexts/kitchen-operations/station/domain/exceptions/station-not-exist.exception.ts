import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class StationNotExist extends DomainException {
  constructor(id: string) {
    super(`Station with id ${id} does not exist`)
  }
}
