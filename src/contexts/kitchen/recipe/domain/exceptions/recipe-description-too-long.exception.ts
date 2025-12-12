import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeDescriptionTooLong extends DomainException {
  constructor() {
    super('Recipe description cannot exceed 500 characters')
  }
}
