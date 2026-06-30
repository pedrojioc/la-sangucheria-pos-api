import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupAssignedToProducts extends DomainException {
  constructor(id: string) {
    super(`Option group <${id}> is assigned to one or more active products and cannot be deleted`)
  }
}
