export interface AdditionalIngredientDetail {
  id: string
  ingredientId: string
  ingredientName: string
  quantityPerUnit: number
  unitId: string
  unitName: string
  unitSymbol: string
}

export class PreparationRecipeDetail {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly baseIngredient: {
      id: string
      name: string
      unit: { id: string; name: string; symbol: string }
    },
    public readonly outputIngredient: {
      id: string
      name: string
      unit: { id: string; name: string; symbol: string }
    },
    public readonly yieldPercentage: number,
    public readonly yieldTolerancePercentage: number,
    public readonly additionalIngredients: AdditionalIngredientDetail[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
