import { RecipeId } from '@contexts/kitchen/recipe/domain/recipe-id'
import { RecipeRepository } from '@contexts/kitchen/recipe/domain/repositories/recipe.repository'
import { RecipeNotFound } from '@contexts/kitchen/recipe/domain/exceptions/recipe-not-found.exception'
import { RecipeItem } from '@contexts/kitchen/recipe/domain/recipe-item'
import { RecipeYield } from '@contexts/kitchen/recipe/domain/recipe-yield'
import { EventBus } from '@/shared/domain/events/event-bus'

export class UpdateRecipe {
  constructor(
    private readonly repository: RecipeRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    items: Array<{ ingredientId: string; quantity: number; unitId: string }>,
    recipeYield: { value: number; unitId: string; description?: string },
    description?: string
  ): Promise<void> {
    const recipe = await this.repository.search(new RecipeId(id))

    if (!recipe) {
      throw new RecipeNotFound(id)
    }

    const recipeItems = items.map(item =>
      RecipeItem.create(item.ingredientId, item.quantity, item.unitId)
    )

    const yield_ = RecipeYield.create(
      recipeYield.value,
      recipeYield.unitId,
      recipeYield.description
    )

    recipe.update(name, recipeItems, yield_, description)

    await this.repository.save(recipe)

    const events = recipe.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
