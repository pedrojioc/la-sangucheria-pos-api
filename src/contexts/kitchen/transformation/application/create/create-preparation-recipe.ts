import { PreparationRecipeRepository } from '../../domain/repositories/preparation-recipe.repository'
import { PreparationRecipe } from '../../domain/preparation-recipe'
import { EventBus } from '@/shared/domain/events'

export class CreatePreparationRecipe {
  constructor(
    private readonly repository: PreparationRecipeRepository,
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
