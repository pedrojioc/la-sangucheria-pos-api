import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class CustomerDocumentAlreadyExists extends DomainException {
  constructor(type: string, number: string) {
    super(`A customer with document ${type} ${number} already exists`)
  }
}
