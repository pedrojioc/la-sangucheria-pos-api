import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * ApprovePurchaseOrder - Use Case
 *
 * Approves a purchase order.
 *
 * Business Rules:
 * - Order must be in PENDING_APPROVAL status
 * - Approver information is recorded
 * - Approval date is captured
 *
 * State Transition:
 * PENDING_APPROVAL → APPROVED
 *
 * Domain Events:
 * - PurchaseOrderApprovedEvent
 */
export class ApprovePurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(purchaseOrderId: string, approvedBy: string): Promise<void> {
    const purchaseOrder = await this.repository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.approve(approvedBy)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
