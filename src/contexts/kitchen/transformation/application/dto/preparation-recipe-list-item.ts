export class PreparationRecipeListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly baseIngredientId: string,
    public readonly baseIngredientName: string,
    public readonly outputIngredientId: string,
    public readonly outputIngredientName: string,
    public readonly yieldPercentage: number,
    public readonly additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
