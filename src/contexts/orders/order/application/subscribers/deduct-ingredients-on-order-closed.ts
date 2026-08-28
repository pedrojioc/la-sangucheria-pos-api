import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderClosedEvent } from '../../domain/events/order-closed.event'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { ProductId } from '@contexts/menu/product/domain/product-id'
import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'

const DIRECT_DEDUCTION_UNIT_ID = 'unit'
const DEDUCTION_REASON = 'Venta de orden'

@Injectable()
export class DeductIngredientsOnOrderClosed implements DomainEventSubscriber<OrderClosedEvent> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productRecipeRepository: ProductRecipeRepository,
    private readonly deductIngredient: DeductIngredient
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderClosedEvent]
  }

  async on(event: OrderClosedEvent): Promise<void> {
    const { orderId, items } = event.toPrimitives()

    for (const item of items) {
      await this.deductForItem(orderId, item.productId, item.quantity)
    }
  }

  private async deductForItem(orderId: string, productId: string, quantity: number): Promise<void> {
    const product = await this.productRepository.search(new ProductId(productId))
    if (!product) return

    switch (product.getInventoryStrategyType()) {
      case 'DIRECT':
        await this.deductDirect(orderId, product.getIngredientId(), quantity)
        return
      case 'RECIPE':
        await this.deductRecipe(orderId, productId, quantity)
        return
      case 'NONE':
        return
    }
  }

  private async deductDirect(
    orderId: string,
    ingredientId: string | null,
    quantity: number
  ): Promise<void> {
    if (!ingredientId) return

    await this.deductIngredient.run(
      ingredientId,
      quantity,
      DIRECT_DEDUCTION_UNIT_ID,
      DEDUCTION_REASON,
      orderId,
      null
    )
  }

  private async deductRecipe(orderId: string, productId: string, quantity: number): Promise<void> {
    const recipe = await this.productRecipeRepository.findByProductId(productId)
    if (!recipe) return

    for (const recipeItem of recipe.getItems()) {
      await this.deductIngredient.run(
        recipeItem.ingredientId.value,
        recipeItem.quantity.value * quantity,
        recipeItem.quantity.unitId,
        DEDUCTION_REASON,
        orderId,
        null
      )
    }
  }
}
