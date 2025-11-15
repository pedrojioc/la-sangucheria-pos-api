import { PurchaseOrder } from '../../domain/purchase-order'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'

/**
 * FindPurchaseOrder - Query
 *
 * Finds a purchase order by its ID.
 *
 * Returns:
 * - PurchaseOrder if found
 * - null if not found
 */
export class FindPurchaseOrder {
  constructor(private readonly repository: PurchaseOrderRepository) {}

  async run(id: string): Promise<PurchaseOrder | null> {
    return this.repository.findById(new PurchaseOrderId(id))
  }
}
