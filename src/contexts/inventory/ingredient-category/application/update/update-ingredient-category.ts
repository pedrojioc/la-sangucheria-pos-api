import { IngredientCategoryRepository } from '@contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { EventBus } from '@shared/domain/events'

export class UpdateIngredientCategory {
  constructor(
    private readonly repository: IngredientCategoryRepository,
    private readonly eventBus: EventBus,
    private readonly findIngredientCategory: FindIngredientCategory
  ) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    icon: string | null,
    color: string | null,
    sortOrder: number | null,
    isActive: boolean
  ): Promise<void> {
    const existing = await this.findIngredientCategory.run(id)
    const updated = existing.update(name, description, icon, color, sortOrder, isActive)

    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}
