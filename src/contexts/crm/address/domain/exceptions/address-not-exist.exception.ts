import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class AddressNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Address with id ${id} does not exist`)
  }
}
