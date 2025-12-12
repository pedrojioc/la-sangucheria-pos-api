export class CreatePreparationRecipeCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseIngredientId: string,
    public readonly outputIngredientId: string,
    public readonly yieldPercentage: number,
    public readonly additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>,
    public readonly description: string | null
  ) {}
}
