import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * RejectPurchaseOrder - Use Case
 *
 * Rejects a purchase order.
 *
 * Business Rules:
 * - Order must be in PENDING_APPROVAL status
 * - Rejection reason should be provided
 * - Rejection is a terminal state
 *
 * State Transition:
 * PENDING_APPROVAL → REJECTED
 *
 * Domain Events:
 * - PurchaseOrderRejectedEvent
 */
export class RejectPurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    rejectedBy: string,
    reason: string | null
  ): Promise<void> {
    const purchaseOrder = await this.repository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.reject(rejectedBy, reason)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
