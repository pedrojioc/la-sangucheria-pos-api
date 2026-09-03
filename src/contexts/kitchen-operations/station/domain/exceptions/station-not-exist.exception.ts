import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class StationNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Station with id ${id} does not exist`)
  }
}
