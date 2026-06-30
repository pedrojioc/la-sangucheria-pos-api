import { PreparationRecipeRepository } from '../../domain/repositories/preparation-recipe.repository'
import { PreparationRecipe } from '../../domain/preparation-recipe'
import { EventBus } from '@/shared/domain/events'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'

export class CreatePreparationRecipe {
  constructor(
    private readonly repository: PreparationRecipeRepository,
    private readonly eventBus: EventBus,
    private readonly findIngredient: FindIngredient
  ) {}

  async run(
    id: string,
    name: string,
    baseIngredientId: string,
    outputIngredientId: string,
    yieldPercentage: number,
    additionalIngredients: Array<{
      id: string
      ingredientId: string
      quantityPerUnit: number
    }>,
    description: string | null,
    yieldTolerancePercentage: number | null = null
  ): Promise<void> {
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

    const recipe = PreparationRecipe.create(
      id,
      name,
      baseIngredientId,
      outputIngredientId,
      yieldPercentage,
      resolvedIngredients,
      description,
      yieldTolerancePercentage ?? undefined
    )

    await this.repository.save(recipe)
    await this.eventBus.publish(recipe.pullDomainEvents())
  }
}
