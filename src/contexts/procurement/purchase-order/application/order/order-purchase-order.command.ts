import { PurchaseMethod } from '../../domain/purchase-method'

export class OrderPurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly orderedBy: string,
    public readonly purchaseMethod: PurchaseMethod,
    public readonly purchaseMethodDetails: string | null = null
  ) {}
}
