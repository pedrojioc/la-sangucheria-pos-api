import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class PositionNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Position with id ${id} does not exist`)
  }
}
