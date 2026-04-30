export class CreatePurchaseOrderCommand {
  constructor(
    public readonly id: string,
    public readonly supplierId: string,
    public readonly requestedBy: string,
    public readonly currency: string,
    public readonly expectedDeliveryDate: Date | null,
    public readonly notes: string | null,
    public readonly items: {
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }[]
  ) {}
}
