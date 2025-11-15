import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'

export class FindAllIngredientCategories {
  constructor(private readonly ingredientCategoryRepository: IngredientCategoryRepository) {}

  async run(): Promise<IngredientCategory[]> {
    const ingredientCategories = await this.ingredientCategoryRepository.searchAll()
    return ingredientCategories
  }
}
