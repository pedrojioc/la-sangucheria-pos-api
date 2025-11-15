import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { IngredientId } from '../../domain/ingredient-id'
import { IngredientNotExist } from '../../domain/exceptions/ingredient-not-exist'
import { Ingredient } from '../../domain/ingredient'

export class FindIngredient {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async run(id: string): Promise<Ingredient> {
    const ingredientId = new IngredientId(id)
    const ingredient = await this.ingredientRepository.search(ingredientId)

    if (!ingredient) {
      throw new IngredientNotExist(ingredientId)
    }

    return ingredient
  }
}
