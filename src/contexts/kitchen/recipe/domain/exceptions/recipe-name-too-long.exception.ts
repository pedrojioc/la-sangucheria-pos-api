import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeNameTooLong extends InvalidValueObjectException {
  constructor() {
    super('Recipe name cannot exceed 100 characters')
  }
}
