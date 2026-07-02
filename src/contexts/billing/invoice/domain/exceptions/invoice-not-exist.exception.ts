import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvoiceNotExist extends DomainException {
  constructor(id: string) {
    super(`Invoice with id '${id}' does not exist.`)
    this.name = 'InvoiceNotExist'
  }
}
