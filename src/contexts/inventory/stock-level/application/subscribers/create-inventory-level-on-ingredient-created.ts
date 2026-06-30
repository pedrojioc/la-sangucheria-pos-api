import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { IngredientCreatedEvent } from '@/contexts/inventory/ingredient/domain/events/ingredient-created.event'
import { InitializeInventoryLevel } from '../initialize-inventory-level/initialize-inventory-level'

export class CreateInventoryLevelOnIngredientCreated
  implements DomainEventSubscriber<IngredientCreatedEvent>
{
  constructor(private readonly initializeInventoryLevel: InitializeInventoryLevel) {}

  subscribedTo(): DomainEventClass[] {
    return [IngredientCreatedEvent]
  }

  async on(event: IngredientCreatedEvent): Promise<void> {
    const { ingredientId, unitId } = event.toPrimitives()
    await this.initializeInventoryLevel.run(ingredientId, unitId)
  }
}
