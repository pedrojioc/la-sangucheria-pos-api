import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class DirectProductRequiresIngredient extends InvalidValueObjectException {
  constructor() {
    super('A product with DIRECT inventory strategy requires an ingredientId')
  }
}
