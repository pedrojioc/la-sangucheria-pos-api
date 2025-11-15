import { PurchaseOrderStatus } from '../../domain/purchase-order-status'

export class FindPurchaseOrdersByStatusQuery {
  constructor(public readonly status: PurchaseOrderStatus) {}
}
