import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeMustHaveItems extends DomainException {
  constructor() {
    super('Recipe must have at least one item')
  }
}
