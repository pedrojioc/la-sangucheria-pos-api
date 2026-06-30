export class CreatePreparationRecipeCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseIngredientId: string,
    public readonly outputIngredientId: string,
    public readonly yieldPercentage: number,
    public readonly additionalIngredients: Array<{
      id: string
      ingredientId: string
      quantityPerUnit: number
    }>,
    public readonly description: string | null,
    public readonly yieldTolerancePercentage: number | null
  ) {}
}
