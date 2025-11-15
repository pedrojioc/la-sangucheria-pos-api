import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'
import { IngredientCategoryId } from '../../domain/ingredient-category-id'
import { IngredientCategoryNotExist } from '../../domain/exceptions/ingredient-category-not-exist'
import { IngredientCategory } from '../../domain/ingredient-category'

export class FindIngredientCategory {
  constructor(private readonly ingredientCategoryRepository: IngredientCategoryRepository) {}

  async run(id: string): Promise<IngredientCategory> {
    const ingredientCategoryId = new IngredientCategoryId(id)
    const ingredientCategory = await this.ingredientCategoryRepository.search(ingredientCategoryId)

    if (!ingredientCategory) {
      throw new IngredientCategoryNotExist(ingredientCategoryId)
    }

    return ingredientCategory
  }
}
