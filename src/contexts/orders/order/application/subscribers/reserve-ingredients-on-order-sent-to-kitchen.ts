import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderSentToKitchenEvent } from '../../domain/events/order-sent-to-kitchen.event'
import { ProductDeductionPlanPort } from '../ports/product-deduction-plan.port'
import { StockReservationLine, StockReservationPort } from '../ports/stock-reservation.port'

const DIRECT_DEDUCTION_UNIT_ID = 'unit'

@Injectable()
export class ReserveIngredientsOnOrderSentToKitchen
  implements DomainEventSubscriber<OrderSentToKitchenEvent>
{
  constructor(
    private readonly productDeductionPlanPort: ProductDeductionPlanPort,
    private readonly stockReservationPort: StockReservationPort
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderSentToKitchenEvent]
  }

  async on(event: OrderSentToKitchenEvent): Promise<void> {
    const { orderId, items } = event.toPrimitives()

    const lines: StockReservationLine[] = []
    for (const item of items) {
      const itemLines = await this.resolveLinesForItem(item.itemId, item.productId, item.quantity)
      lines.push(...itemLines)
    }

    if (lines.length === 0) return

    await this.stockReservationPort.reserve(orderId, lines)
  }

  private async resolveLinesForItem(
    itemId: string,
    productId: string,
    quantity: number
  ): Promise<StockReservationLine[]> {
    const plan = await this.productDeductionPlanPort.findPlan(productId)
    if (!plan) return []

    switch (plan.strategy) {
      case 'DIRECT':
        return this.resolveDirectLine(itemId, plan.ingredientId, quantity)
      case 'RECIPE':
        return this.resolveRecipeLines(itemId, productId, quantity)
      case 'NONE':
        return []
    }
  }

  private resolveDirectLine(
    itemId: string,
    ingredientId: string | null,
    quantity: number
  ): StockReservationLine[] {
    if (!ingredientId) return []

    return [
      {
        itemId,
        ingredientId,
        quantity,
        unitId: DIRECT_DEDUCTION_UNIT_ID
      }
    ]
  }

  private async resolveRecipeLines(
    itemId: string,
    productId: string,
    quantity: number
  ): Promise<StockReservationLine[]> {
    const recipeItems = await this.productDeductionPlanPort.findRecipeItems(productId)
    if (!recipeItems) return []

    return recipeItems.map(recipeItem => ({
      itemId,
      ingredientId: recipeItem.ingredientId,
      quantity: recipeItem.quantity * quantity,
      unitId: recipeItem.unitId
    }))
  }
}
