import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class DirectProductRequiresIngredient extends DomainException {
  constructor() {
    super('A product with DIRECT inventory strategy requires an ingredientId')
  }
}
