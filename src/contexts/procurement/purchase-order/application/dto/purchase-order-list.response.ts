import { PurchaseOrderDetailReadModel } from './purchase-order-detail-read-model'
import { PurchaseOrderResponse } from './purchase-order.response'

/**
 * @deprecated Use PaginatedPurchaseOrderListResponse instead
 *
 * This class is kept for backward compatibility but should not be used
 * for new code. Use PaginatedPurchaseOrderListResponse with PurchaseOrderListItemResponse.
 */
export class PurchaseOrderListResponse {
  constructor(public readonly purchaseOrders: PurchaseOrderResponse[]) {}

  static fromReadModels(readModels: PurchaseOrderDetailReadModel[]): PurchaseOrderListResponse {
    return new PurchaseOrderListResponse(
      readModels.map(rm => PurchaseOrderResponse.fromReadModel(rm))
    )
  }
}
