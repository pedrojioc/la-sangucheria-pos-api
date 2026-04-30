import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { InventoryBatchCreatedEvent } from '@/contexts/inventory/batch/domain/events/inventory-batch-created.event'
import { CreatePurchaseMovement } from '../create-purchase-movement/create-purchase-movement'

export class CreateInventoryMovementOnInventoryBatchCreated
  implements DomainEventSubscriber<InventoryBatchCreatedEvent>
{
  constructor(private readonly createPurchaseMovement: CreatePurchaseMovement) {}

  subscribedTo(): DomainEventClass[] {
    return [InventoryBatchCreatedEvent]
  }

  async on(event: InventoryBatchCreatedEvent): Promise<void> {
    const payload = event.toPrimitives()

    await this.createPurchaseMovement.run(
      payload.ingredientId,
      payload.quantity,
      payload.unitId,
      payload.unitCost,
      payload.currency,
      payload.batchId,
      payload.referenceCode,
      payload.purchaseDate
    )
  }
}
