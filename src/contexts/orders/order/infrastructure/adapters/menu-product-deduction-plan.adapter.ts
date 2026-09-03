import { Injectable } from '@nestjs/common'
import { FindProduct } from '@contexts/menu/product/application/find/find-product'
import { ProductNotExist } from '@contexts/menu/product/domain/exceptions/product-not-exist.exception'
import { FindProductRecipe } from '@contexts/menu/product-recipe/application/find/find-product-recipe'
import { ProductRecipeNotFound } from '@contexts/menu/product-recipe/domain/exceptions/product-recipe-not-found.exception'
import {
  ProductDeductionPlan,
  ProductDeductionPlanPort,
  RecipeDeductionItem
} from '../../application/ports/product-deduction-plan.port'

@Injectable()
export class MenuProductDeductionPlanAdapter extends ProductDeductionPlanPort {
  constructor(
    private readonly findProduct: FindProduct,
    private readonly findProductRecipe: FindProductRecipe
  ) {
    super()
  }

  async findPlan(productId: string): Promise<ProductDeductionPlan | null> {
    try {
      const product = await this.findProduct.run(productId)
      return {
        strategy: product.getInventoryStrategyType(),
        ingredientId: product.getIngredientId()
      }
    } catch (error) {
      if (error instanceof ProductNotExist) return null
      throw error
    }
  }

  async findRecipeItems(productId: string): Promise<RecipeDeductionItem[] | null> {
    try {
      const recipe = await this.findProductRecipe.run(productId)
      return recipe.getItems().map(item => ({
        ingredientId: item.ingredientId.value,
        quantity: item.quantity.value,
        unitId: item.quantity.unitId
      }))
    } catch (error) {
      if (error instanceof ProductRecipeNotFound) return null
      throw error
    }
  }
}
