import { PurchaseOrder } from '../../domain/purchase-order'
import { PurchaseOrderResponse } from './purchase-order.response'

export class PurchaseOrderListResponse {
  constructor(public readonly purchaseOrders: PurchaseOrderResponse[]) {}

  static fromDomain(purchaseOrders: PurchaseOrder[]): PurchaseOrderListResponse {
    return new PurchaseOrderListResponse(
      purchaseOrders.map(po => PurchaseOrderResponse.fromDomain(po))
    )
  }
}
