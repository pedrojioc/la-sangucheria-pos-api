import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class ZoneNotExist extends NotFoundException {
  constructor(id: string) {
    super(`La zona con id ${id} no existe`)
  }
}
