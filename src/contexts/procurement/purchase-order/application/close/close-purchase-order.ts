import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * ClosePurchaseOrder - Use Case
 *
 * Closes a purchase order (terminal state).
 *
 * Business Rules:
 * - Order must be in RECEIVED or PARTIALLY_RECEIVED status
 * - Closing marks the order as complete
 * - This is a terminal state - no further modifications allowed
 *
 * State Transition:
 * RECEIVED → CLOSED
 * PARTIALLY_RECEIVED → CLOSED (manual close with partial reception)
 *
 * Domain Events:
 * - PurchaseOrderClosedEvent
 */
export class ClosePurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(purchaseOrderId: string, closedBy: string): Promise<void> {
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.close(closedBy)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
