import { PreparationRecipe } from '../../domain/preparation-recipe'

export class PreparationRecipeResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly baseIngredientId: string,
    public readonly outputIngredientId: string,
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

  static fromDomain(recipe: PreparationRecipe): PreparationRecipeResponse {
    const p = recipe.toPrimitives()
    return new PreparationRecipeResponse(
      p.id,
      p.name,
      p.description,
      p.baseIngredientId,
      p.outputIngredientId,
      p.yieldPercentage,
      p.additionalIngredients,
      p.isActive,
      p.createdAt,
      p.updatedAt
    )
  }
}
