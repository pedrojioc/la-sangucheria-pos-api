import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { EventBus } from '@/shared/domain/events'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { FindIngredient } from '../find/find-ingredient'
import { IngredientId } from '../../domain/ingredient-id'
import { IngredientNotExist } from '../../domain/exceptions/ingredient-not-exist'
import { IngredientUnitChangeNotAllowedException } from '../../domain/exceptions/ingredient-unit-change-not-allowed.exception'

export class UpdateIngredient {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly findIngredient: FindIngredient,
    private readonly findIngredientCategory: FindIngredientCategory,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    ingredientCategoryId: string,
    unitId: string,
    preferredSupplierId: string | null,
    minimumStock: number | null,
    maximumStock: number | null,
    isPerishable: boolean,
    shelfLifeDays: number | null,
    storageLocation: string | null,
    isActive: boolean
  ): Promise<void> {
    const ingredient = await this.findIngredient.run(id)

    const currentUnitId = ingredient.toPrimitives().unitId
    if (unitId !== currentUnitId) {
      const ingredientId = new IngredientId(id)
      const locked = await this.ingredientRepository.hasTransactions(ingredientId)
      if (locked) {
        throw new IngredientUnitChangeNotAllowedException(id)
      }
    }

    await this.findIngredientCategory.run(ingredientCategoryId)

    ingredient.update(
      name,
      description,
      ingredientCategoryId,
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
