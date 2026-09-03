import { NotFoundException } from '@shared/domain/exceptions/domain.exception'
import { IngredientCategoryId } from '../ingredient-category-id'

export class IngredientCategoryNotExist extends NotFoundException {
  constructor(id: IngredientCategoryId) {
    super(`Ingredient category with id ${id.value} not exist`)
    this.name = 'IngredientCategoryNotExist'
  }
}
