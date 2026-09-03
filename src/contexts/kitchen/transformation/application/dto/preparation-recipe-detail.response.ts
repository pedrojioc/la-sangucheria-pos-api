import {
  PreparationRecipeDetail,
  AdditionalIngredientDetail
} from '@contexts/kitchen/transformation/application/dto/preparation-recipe-detail'

export class PreparationRecipeDetailResponse {
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

  static fromReadModel(detail: PreparationRecipeDetail): PreparationRecipeDetailResponse {
    return new PreparationRecipeDetailResponse(
      detail.id,
      detail.name,
      detail.description,
      detail.baseIngredient,
      detail.outputIngredient,
      detail.yieldPercentage,
      detail.yieldTolerancePercentage,
      detail.additionalIngredients,
      detail.isActive,
      detail.createdAt,
      detail.updatedAt
    )
  }
}
