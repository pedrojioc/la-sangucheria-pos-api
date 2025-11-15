export class DeductIngredientCommand {
  constructor(
    public readonly ingredientId: string,
    public readonly quantity: number,
    public readonly unitId: string,
    public readonly reason: string | null,
    public readonly referenceId: string | null, // ID de venta, orden, etc.
    public readonly performedBy: string | null
  ) {}
}
