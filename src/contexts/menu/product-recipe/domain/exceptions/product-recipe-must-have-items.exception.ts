import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class ProductRecipeMustHaveItems extends InvalidValueObjectException {
  constructor() {
    super('Product recipe must have at least one ingredient')
  }
}
