export class RejectPurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly rejectedBy: string,
    public readonly reason: string | null
  ) {}
}
