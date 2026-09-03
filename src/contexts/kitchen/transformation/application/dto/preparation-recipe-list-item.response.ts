import { PreparationRecipeListItem } from './preparation-recipe-list-item'

export class PreparationRecipeListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly baseIngredient: { id: string; name: string; unitId: string },
    public readonly outputIngredient: { id: string; name: string; unitId: string },
    public readonly yieldPercentage: number,
    public readonly additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
    }>,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromReadModel(item: PreparationRecipeListItem): PreparationRecipeListItemResponse {
    return new PreparationRecipeListItemResponse(
      item.id,
      item.name,
      item.description,
      item.baseIngredient,
      item.outputIngredient,
      item.yieldPercentage,
      item.additionalIngredients,
      item.isActive,
      item.createdAt,
      item.updatedAt
    )
  }
}
