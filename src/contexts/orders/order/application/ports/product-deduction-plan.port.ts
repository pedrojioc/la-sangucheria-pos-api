export type ProductDeductionStrategy = 'DIRECT' | 'RECIPE' | 'NONE'

export interface ProductDeductionPlan {
  strategy: ProductDeductionStrategy
  ingredientId: string | null
}

export interface RecipeDeductionItem {
  ingredientId: string
  quantity: number
  unitId: string
}

export abstract class ProductDeductionPlanPort {
  abstract findPlan(productId: string): Promise<ProductDeductionPlan | null>
  abstract findRecipeItems(productId: string): Promise<RecipeDeductionItem[] | null>
}
