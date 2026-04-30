import { PurchaseOrderQueryService } from '../services/purchase-order-query.service'
import { PurchaseOrderDetailReadModel } from '../dto/purchase-order-detail-read-model'

/**
 * FindPurchaseOrder - Query (Read Operation)
 *
 * Finds a purchase order by its ID and returns enriched data for display.
 * Uses QueryService instead of Repository because this is a READ operation
 * that needs supplier and ingredient data for the UI.
 *
 * Returns:
 * - PurchaseOrderDetailReadModel if found (with supplier/ingredient names)
 * - null if not found
 */
export class FindPurchaseOrder {
  constructor(private readonly queryService: PurchaseOrderQueryService) {}

  async run(id: string): Promise<PurchaseOrderDetailReadModel | null> {
    return this.queryService.findDetail(id)
  }
}
