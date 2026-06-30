import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class OrderNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Orden con id ${id} no existe`)
  }
}
