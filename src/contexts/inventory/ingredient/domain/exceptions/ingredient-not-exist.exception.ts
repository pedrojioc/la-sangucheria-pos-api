import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'
import { IngredientId } from '../ingredient-id'

export class IngredientNotExist extends NotFoundException {
  constructor(id: IngredientId) {
    super(`Ingredient with id ${id.value} not exist`)
    this.name = 'IngredientNotExist'
  }
}
