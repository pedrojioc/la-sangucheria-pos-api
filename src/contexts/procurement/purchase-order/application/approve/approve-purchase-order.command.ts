export class ApprovePurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly approvedBy: string
  ) {}
}
