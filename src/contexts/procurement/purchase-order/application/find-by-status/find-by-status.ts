import { PurchaseOrder } from '../../domain/purchase-order'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderStatus } from '../../domain/purchase-order-status'

/**
 * FindPurchaseOrdersByStatus - Query
 *
 * Finds all purchase orders with a specific status.
 *
 * Common use cases:
 * - Find all PENDING_APPROVAL orders (for approvers)
 * - Find all SENT orders (for reception tracking)
 * - Find all DRAFT orders (for editing)
 */
export class FindPurchaseOrdersByStatus {
  constructor(private readonly repository: PurchaseOrderRepository) {}

  async run(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return this.repository.findByStatus(status)
  }
}
