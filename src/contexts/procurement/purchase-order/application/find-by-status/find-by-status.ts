import { PurchaseOrderQueryService } from '../services/purchase-order-query.service'
import { PurchaseOrderListItem } from '../dto/purchase-order-list-item'
import { PurchaseOrderStatus } from '../../domain/purchase-order-status'
import { Criteria } from '@/shared/domain/criteria/criteria'

/**
 * FindPurchaseOrdersByStatus - Query (Read Operation)
 *
 * Finds all purchase orders with a specific status.
 * Uses QueryService because this returns data for UI display.
 *
 * Common use cases:
 * - Find all PENDING_APPROVAL orders (for approvers)
 * - Find all APPROVED orders (for reception tracking)
 * - Find all DRAFT orders (for editing)
 */
export class FindPurchaseOrdersByStatus {
  constructor(private readonly queryService: PurchaseOrderQueryService) {}

  async run(status: PurchaseOrderStatus): Promise<PurchaseOrderListItem[]> {
    const criteria = Criteria.fromPrimitives({
      filters: [{ field: 'status', operator: '=', value: status }],
      orderBy: 'requestedDate',
      orderType: 'desc',
      page: 1,
      pageSize: 100 // Reasonable limit for status-based queries
    })

    const result = await this.queryService.search(criteria)
    return result.data
  }
}
