export interface ReceivedItemData {
  purchaseOrderItemId: string
  quantityReceived: number
  quantityReceivedUnitId: string
  unitCost: number
  notes: string | null
}

export class RegisterItemReceptionCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly items: ReceivedItemData[],
    public readonly notes: string | null,
    public readonly closeOrder: boolean = false,
    public readonly receivedBy: string | null = null
  ) {}
}
