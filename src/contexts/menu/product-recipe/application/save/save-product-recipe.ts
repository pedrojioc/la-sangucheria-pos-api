import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeItem } from '@contexts/menu/product-recipe/domain/product-recipe-item'
import { EventBus } from '@shared/domain/events'

export class SaveProductRecipe {
  constructor(
    private readonly repository: ProductRecipeRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    recipeId: string,
    productId: string,
    items: Array<{ ingredientId: string; quantity: number; unitId: string }>
  ): Promise<void> {
    const existing = await this.repository.findByProductId(productId)

    const recipeItems = items.map(i =>
      ProductRecipeItem.create(i.ingredientId, i.quantity, i.unitId)
    )

    let recipe: ProductRecipe

    if (existing) {
      existing.update(recipeItems)
      recipe = existing
    } else {
      recipe = ProductRecipe.create(recipeId, productId, recipeItems)
    }

    await this.repository.save(recipe)
    await this.eventBus.publish(recipe.pullDomainEvents())
  }
}
