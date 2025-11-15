export class RegisterItemReceptionCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly itemId: string,
    public readonly quantityReceived: number,
    public readonly unitId: string
  ) {}
}
