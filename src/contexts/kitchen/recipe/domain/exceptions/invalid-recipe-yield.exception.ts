import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidRecipeYield extends InvalidValueObjectException {
  constructor() {
    super('Recipe yield quantity must be greater than zero')
  }
}
