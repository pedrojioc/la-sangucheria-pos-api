export class AddItemToPurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly itemId: string,
    public readonly ingredientId: string,
    public readonly quantityRequested: number,
    public readonly unitId: string,
    public readonly unitCost: number,
    public readonly currency: string,
    public readonly notes: string | null
  ) {}
}
