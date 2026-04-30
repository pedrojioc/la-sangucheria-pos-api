import { PurchaseMethod } from '../../domain/purchase-method'

export class SendPurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly sentBy: string,
    public readonly purchaseMethod: PurchaseMethod,
    public readonly purchaseMethodDetails: string | null = null
  ) {}
}
