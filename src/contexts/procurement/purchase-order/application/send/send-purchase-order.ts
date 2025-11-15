import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * SendPurchaseOrder - Use Case
 *
 * Marks a purchase order as sent to the supplier.
 *
 * Business Rules:
 * - Order must be in APPROVED status
 * - Send date is captured
 * - Order details should be communicated to supplier
 *
 * State Transition:
 * APPROVED → SENT
 *
 * Domain Events:
 * - PurchaseOrderSentEvent
 */
export class SendPurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(purchaseOrderId: string, sentBy: string): Promise<void> {
    const purchaseOrder = await this.repository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.markAsSent(sentBy)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
