import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeDescriptionTooLong extends InvalidValueObjectException {
  constructor() {
    super('Recipe description cannot exceed 500 characters')
  }
}
