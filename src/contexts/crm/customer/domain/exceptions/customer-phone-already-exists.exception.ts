import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class CustomerPhoneAlreadyExists extends DomainException {
  constructor(phone: string) {
    super(`A customer with phone ${phone} already exists`)
  }
}
