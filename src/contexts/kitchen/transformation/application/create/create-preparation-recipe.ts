import { PreparationRecipeRepository } from '../../domain/repositories/preparation-recipe.repository'
import { PreparationRecipe } from '../../domain/preparation-recipe'
import { EventBus } from '@/shared/domain/events'
import { FindIngredient } from '@/contexts/inventory/ingredient/application/find/find-ingredient'

export class CreatePreparationRecipe {
  constructor(
    private readonly repository: PreparationRecipeRepository,
    private readonly findIngredient: FindIngredient,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    baseIngredientId: string,
    outputIngredientId: string,
    yieldPercentage: number,
    additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>,
    description: string | null
  ): Promise<void> {
    await this.findIngredient.run(baseIngredientId)
    await this.findIngredient.run(outputIngredientId)

    const recipe = PreparationRecipe.create(
      id,
      name,
      baseIngredientId,
      outputIngredientId,
      yieldPercentage,
      additionalIngredients,
      description
    )

    await this.repository.save(recipe)
    await this.eventBus.publish(recipe.pullDomainEvents())
  }
}
