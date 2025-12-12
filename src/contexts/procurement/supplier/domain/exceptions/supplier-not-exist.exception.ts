import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class SupplierNotExist extends DomainException {
  constructor(id: string) {
    super(`Supplier with id ${id} does not exist`)
  }
}
