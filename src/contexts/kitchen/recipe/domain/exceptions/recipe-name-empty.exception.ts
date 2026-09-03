import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeNameEmpty extends InvalidValueObjectException {
  constructor() {
    super('Recipe name cannot be empty')
  }
}
