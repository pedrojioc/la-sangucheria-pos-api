import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class ProductRecipeMustHaveItems extends DomainException {
  constructor() {
    super('Product recipe must have at least one ingredient')
  }
}
