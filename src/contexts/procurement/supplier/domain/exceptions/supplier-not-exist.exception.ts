import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class SupplierNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Supplier with id ${id} does not exist`)
  }
}
