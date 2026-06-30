export class CancelPurchaseOrderItemsCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly itemId: string,
    public readonly reason: string | null
  ) {}
}
