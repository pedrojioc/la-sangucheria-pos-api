import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class TableNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Mesa con id ${id} no existe`)
  }
}
