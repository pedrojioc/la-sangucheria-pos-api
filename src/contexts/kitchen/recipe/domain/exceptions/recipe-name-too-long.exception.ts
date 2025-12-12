import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeNameTooLong extends DomainException {
  constructor() {
    super('Recipe name cannot exceed 100 characters')
  }
}
