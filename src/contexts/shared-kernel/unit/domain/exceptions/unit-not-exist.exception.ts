import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class UnitNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Unit with id ${id} does not exist`)
  }
}
