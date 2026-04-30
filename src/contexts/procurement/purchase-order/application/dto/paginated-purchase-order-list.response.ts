import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { PurchaseOrderListItemResponse } from './purchase-order-list-item.response'

/**
 * PaginatedPurchaseOrderListResponse - Paginated Response Wrapper
 *
 * Envuelve la lista de órdenes con metadatos de paginación.
 */
export class PaginatedPurchaseOrderListResponse {
  constructor(
    public readonly data: PurchaseOrderListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
