import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class InvoiceNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Invoice with id '${id}' does not exist.`)
    this.name = 'InvoiceNotExist'
  }
}
