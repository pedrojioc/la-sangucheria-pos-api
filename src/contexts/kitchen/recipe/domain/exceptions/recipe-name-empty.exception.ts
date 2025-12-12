import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class RecipeNameEmpty extends DomainException {
  constructor() {
    super('Recipe name cannot be empty')
  }
}
