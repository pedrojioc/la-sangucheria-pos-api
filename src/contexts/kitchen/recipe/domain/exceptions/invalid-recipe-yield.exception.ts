import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidRecipeYield extends DomainException {
  constructor() {
    super('Recipe yield quantity must be greater than zero')
  }
}
