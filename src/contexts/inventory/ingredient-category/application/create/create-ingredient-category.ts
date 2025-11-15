import { EventBus } from '@/shared/domain/events'
import { IngredientCategory } from '../../domain/ingredient-category'
import { IngredientCategoryRepository } from '../../domain/repositories/ingredient-category.repository'

export class CreateIngredientCategory {
  constructor(
    private readonly ingredientCategoryRepository: IngredientCategoryRepository,
    private readonly eventBus: EventBus
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
    const ingredientCategory = IngredientCategory.create(
      id,
      name,
      description,
      icon,
      color,
      sortOrder,
      isActive
    )

    await this.ingredientCategoryRepository.save(ingredientCategory)

    const events = ingredientCategory.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
