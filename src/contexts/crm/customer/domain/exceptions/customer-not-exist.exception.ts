import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class CustomerNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Customer with id ${id} does not exist`)
  }
}
