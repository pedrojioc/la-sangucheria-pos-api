import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderClosedEvent } from '../../domain/events/order-closed.event'
import { ProductDeductionPlanPort } from '../ports/product-deduction-plan.port'
import { IngredientDeductionPort } from '../ports/ingredient-deduction.port'

const DIRECT_DEDUCTION_UNIT_ID = 'unit'
const DEDUCTION_REASON = 'Venta de orden'

@Injectable()
export class DeductIngredientsOnOrderClosed implements DomainEventSubscriber<OrderClosedEvent> {
  constructor(
    private readonly productDeductionPlanPort: ProductDeductionPlanPort,
    private readonly ingredientDeductionPort: IngredientDeductionPort
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
    const plan = await this.productDeductionPlanPort.findPlan(productId)
    if (!plan) return

    switch (plan.strategy) {
      case 'DIRECT':
        await this.deductDirect(orderId, plan.ingredientId, quantity)
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

    await this.ingredientDeductionPort.deduct(
      ingredientId,
      quantity,
      DIRECT_DEDUCTION_UNIT_ID,
      DEDUCTION_REASON,
      orderId
    )
  }

  private async deductRecipe(orderId: string, productId: string, quantity: number): Promise<void> {
    const items = await this.productDeductionPlanPort.findRecipeItems(productId)
    if (!items) return

    for (const item of items) {
      await this.ingredientDeductionPort.deduct(
        item.ingredientId,
        item.quantity * quantity,
        item.unitId,
        DEDUCTION_REASON,
        orderId
      )
    }
  }
}
