import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * RegisterItemReception - Use Case
 *
 * Registers the reception of a purchase order item.
 *
 * Business Rules:
 * - Order must be in SENT or PARTIALLY_RECEIVED status
 * - Item must exist in the order
 * - Can receive partial quantities
 * - Can receive multiple times (accumulates)
 * - Auto-transitions order status based on received items
 *
 * State Transitions:
 * SENT → PARTIALLY_RECEIVED (if not all items received)
 * SENT → RECEIVED (if all items fully received)
 * PARTIALLY_RECEIVED → RECEIVED (if all items fully received)
 *
 * Domain Events:
 * - PurchaseOrderItemReceivedEvent (triggers inventory update)
 */
export class RegisterItemReception {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    itemId: string,
    quantityReceived: number,
    unitId: string
  ): Promise<void> {
    const purchaseOrder = await this.repository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.registerItemReception(itemId, quantityReceived, unitId)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
