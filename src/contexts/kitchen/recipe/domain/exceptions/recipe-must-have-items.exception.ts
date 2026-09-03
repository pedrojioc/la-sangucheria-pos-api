import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeMustHaveItems extends InvalidValueObjectException {
  constructor() {
    super('Recipe must have at least one item')
  }
}
