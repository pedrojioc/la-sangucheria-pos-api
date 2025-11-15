import { Ingredient } from '../../domain/ingredient'
import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { EventBus } from '@/shared/domain/events'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'

export class CreateIngredient {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly findIngredientCategory: FindIngredientCategory,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    ingredientCategoryId: string,
    baseUnit: string,
    preferredSupplierId: string | null,
    minimumStock: number | null,
    maximumStock: number | null,
    isPerishable: boolean,
    shelfLifeDays: number | null,
    storageLocation: string | null,
    isActive: boolean
  ): Promise<void> {
    // Validate that category exists
    const category = await this.findIngredientCategory.run(ingredientCategoryId)

    const ingredient = Ingredient.create(
      id,
      name,
      description,
      category.id.value,
      baseUnit,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    )

    await this.ingredientRepository.save(ingredient)

    const events = ingredient.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
