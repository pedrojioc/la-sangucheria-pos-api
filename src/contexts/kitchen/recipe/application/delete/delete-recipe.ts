import { RecipeId } from '@contexts/kitchen/recipe/domain/recipe-id'
import { RecipeRepository } from '@contexts/kitchen/recipe/domain/repositories/recipe.repository'
import { RecipeNotFound } from '@contexts/kitchen/recipe/domain/exceptions/recipe-not-found.exception'
import { EventBus } from '@/shared/domain/events/event-bus'
import { RecipeDeletedEvent } from '@contexts/kitchen/recipe/domain/events/recipe-deleted.event'

export class DeleteRecipe {
  constructor(
    private readonly repository: RecipeRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const recipe = await this.repository.search(new RecipeId(id))

    if (!recipe) {
      throw new RecipeNotFound(id)
    }

    await this.repository.delete(new RecipeId(id))

    await this.eventBus.publish([
      new RecipeDeletedEvent({
        recipeId: id,
        name: recipe.getName()
      })
    ])
  }
}
