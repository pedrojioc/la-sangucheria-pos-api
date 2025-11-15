import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { Ingredient } from '../../domain/ingredient'

export class FindAllIngredients {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async run(): Promise<Ingredient[]> {
    const ingredients = await this.ingredientRepository.searchAll()
    return ingredients
  }
}
