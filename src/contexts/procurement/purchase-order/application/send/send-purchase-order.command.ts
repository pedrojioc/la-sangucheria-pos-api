export class SendPurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly sentBy: string
  ) {}
}
