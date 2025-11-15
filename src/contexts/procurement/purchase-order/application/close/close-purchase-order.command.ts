export class ClosePurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly closedBy: string
  ) {}
}
