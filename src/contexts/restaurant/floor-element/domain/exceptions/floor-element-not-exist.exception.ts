import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class FloorElementNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Floor element with id ${id} does not exist`)
  }
}
