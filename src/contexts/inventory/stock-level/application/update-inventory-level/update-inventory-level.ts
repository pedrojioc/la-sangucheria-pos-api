import { InventoryLevelRepository } from '../../domain/repositories/inventory-level.repository'
import { InventoryLevel } from '../../domain/inventory-level'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { MovementType } from '../../domain/movement-type'
import { EventBus } from '@/shared/domain/events'
import { Uuid } from '@/shared/domain/value-objects/uuid'

/**
 * UpdateInventoryLevel - Use Case
 *
 * Actualiza el nivel de inventario de un ingrediente basándose en un movimiento.
 * Si el nivel no existe, lo crea. Publica eventos de stock (LowStock, OutOfStock).
 */
export class UpdateInventoryLevel {
  constructor(
    private readonly levelRepository: InventoryLevelRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    ingredientId: string,
    quantity: number,
    unitId: string,
    movementType: MovementType
  ): Promise<void> {
    const ingredientIdVO = new IngredientId(ingredientId)

    let level = await this.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      level = InventoryLevel.create(Uuid.random().value, ingredientId, 0, unitId)
    }

    const quantityVO = new Quantity(quantity, unitId)

    if (movementType === MovementType.PURCHASE) {
      level.increase(quantityVO)
    } else {
      level.decrease(quantityVO)
    }

    await this.levelRepository.save(level)

    const events = level.pullDomainEvents()
    if (events.length > 0) {
      await this.eventBus.publish(events)
    }
  }
}
