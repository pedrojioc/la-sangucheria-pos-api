import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class KitchenTicketPrintJobNotFound extends NotFoundException {
  constructor(id: string) {
    super(`Kitchen ticket print job with id ${id} does not exist`)
  }
}
