import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { InventoryMovementCreatedEvent } from '../../domain/events/inventory-movement-created.event'
import { UpdateInventoryLevel } from '../update-inventory-level/update-inventory-level'

export class UpdateInventoryLevelOnInventoryMovementCreated
  implements DomainEventSubscriber<InventoryMovementCreatedEvent>
{
  constructor(private readonly updateInventoryLevel: UpdateInventoryLevel) {}

  subscribedTo(): DomainEventClass[] {
    return [InventoryMovementCreatedEvent]
  }

  async on(event: InventoryMovementCreatedEvent): Promise<void> {
    const payload = event.toPrimitives()

    await this.updateInventoryLevel.run(
      payload.ingredientId,
      payload.quantity,
      payload.unitId,
      payload.type
    )
  }
}
