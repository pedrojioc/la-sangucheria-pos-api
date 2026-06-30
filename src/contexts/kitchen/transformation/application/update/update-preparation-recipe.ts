import { PreparationRecipeRepository } from '../../domain/repositories/preparation-recipe.repository'
import { PreparationRecipeId } from '../../domain/preparation-recipe-id'
import { PreparationRecipeNotFoundException } from '../../domain/exceptions/preparation-recipe-not-found.exception'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'

export class UpdatePreparationRecipe {
  constructor(
    private readonly repository: PreparationRecipeRepository,
    private readonly findIngredient: FindIngredient
  ) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    yieldPercentage: number,
    yieldTolerancePercentage: number,
    additionalIngredients: Array<{
      id: string
      ingredientId: string
      quantityPerUnit: number
    }>
  ): Promise<void> {
    const recipe = await this.repository.search(new PreparationRecipeId(id))

    if (!recipe) {
      throw new PreparationRecipeNotFoundException(id)
    }

    const resolvedIngredients = await Promise.all(
      additionalIngredients.map(async ai => {
        const ingredient = await this.findIngredient.run(ai.ingredientId)
        return {
          id: ai.id,
          ingredientId: ai.ingredientId,
          quantityPerUnit: ai.quantityPerUnit,
          unitId: ingredient.toPrimitives().unitId
        }
      })
    )

    recipe.update(name, description, yieldPercentage, yieldTolerancePercentage, resolvedIngredients)

    await this.repository.save(recipe)
  }
}
