/**
 * UpdatePurchaseOrderCommand
 *
 * Command for updating a purchase order in DRAFT status.
 * This is a CQRS command (POJO) that carries the data needed for the use case.
 *
 * The items array represents the complete desired state of the order's items.
 * The use case will calculate the diff and determine which items to add/remove.
 */
export class UpdatePurchaseOrderCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly supplierId?: string,
    public readonly expectedDeliveryDate?: Date | null,
    public readonly notes?: string | null,
    public readonly items?: Array<{
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }>
  ) {}
}
