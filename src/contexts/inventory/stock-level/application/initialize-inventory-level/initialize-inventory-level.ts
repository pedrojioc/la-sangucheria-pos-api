import { InventoryLevelRepository } from '../../domain/repositories/inventory-level.repository'
import { InventoryLevel } from '../../domain/inventory-level'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { Uuid } from '@/shared/domain/value-objects/uuid'

export class InitializeInventoryLevel {
  constructor(private readonly levelRepository: InventoryLevelRepository) {}

  async run(ingredientId: string, unitId: string): Promise<void> {
    const existing = await this.levelRepository.findByIngredient(new IngredientId(ingredientId))

    if (existing) return

    const level = InventoryLevel.create(Uuid.random().value, ingredientId, 0, unitId)
    await this.levelRepository.save(level)
  }
}
