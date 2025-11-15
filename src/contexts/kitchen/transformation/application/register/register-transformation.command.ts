export class RegisterTransformationCommand {
  constructor(
    public readonly transformationId: string,
    public readonly recipeId: string,
    public readonly inputQuantity: number,
    public readonly inputUnitId: string,
    public readonly outputQuantity: number,
    public readonly outputUnitId: string,
    public readonly performedBy: string | null,
    public readonly notes: string | null
  ) {}
}
