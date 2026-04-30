export class RegisterPurchaseCommand {
  constructor(
    public readonly batchId: string,
    public readonly ingredientId: string,
    public readonly quantity: number,
    public readonly unitId: string,
    public readonly unitCost: number,
    public readonly currency: string,
    public readonly purchaseDate: Date,
    public readonly expirationDate: Date | null,
    public readonly supplier: string | null,
    public readonly referenceCode: string | null
  ) {}
}
