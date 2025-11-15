import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * SubmitForApproval - Use Case
 *
 * Submits a purchase order for approval.
 *
 * Business Rules:
 * - Order must be in DRAFT status
 * - Order must have at least one item
 * - After submission, order cannot be modified
 *
 * State Transition:
 * DRAFT → PENDING_APPROVAL
 */
export class SubmitForApproval {
  constructor(private readonly repository: PurchaseOrderRepository) {}

  async run(purchaseOrderId: string): Promise<void> {
    const purchaseOrder = await this.repository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    purchaseOrder.submitForApproval()

    await this.repository.save(purchaseOrder)
  }
}
