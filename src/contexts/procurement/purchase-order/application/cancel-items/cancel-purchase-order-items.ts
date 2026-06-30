import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * CancelPurchaseOrderItems - Use Case
 *
 * Cancels specific items in a purchase order when the supplier
 * cannot fulfill them.
 *
 * Business Rules:
 * - Order must be in ORDERED or PARTIALLY_RECEIVED status
 * - Items must exist in the order
 * - Items cannot be already received
 *
 * State Transitions:
 * ORDERED → CLOSED (auto-close if all items cancelled with no physical reception)
 * PARTIALLY_RECEIVED → CLOSED (auto-close if all remaining items cancelled)
 * Otherwise: order stays in its current state
 */
export class CancelPurchaseOrderItems {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(purchaseOrderId: string, itemId: string, reason: string | null): Promise<void> {
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.cancelItem(itemId, reason)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
