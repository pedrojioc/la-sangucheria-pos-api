export class CancelPurchaseOrderItemsCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly itemIds: string[],
    public readonly reason: string | null
  ) {}
}
