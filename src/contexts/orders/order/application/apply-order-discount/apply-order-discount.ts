import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { Discount } from '../../domain/discount'
import { DiscountType } from '../../domain/discount-type'
import { DiscountMethod } from '../../domain/discount-method'
import { EventBus } from '@shared/domain/events'

export class ApplyOrderDiscount {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(
    orderId: string,
    type: DiscountType,
    method: DiscountMethod,
    value: number,
    appliedBy: string,
    reason?: string | null
  ): Promise<void> {
    const order = await this.findOrder.run(orderId)
    const discount = Discount.create(type, method, value, appliedBy, reason)
    order.applyOrderDiscount(discount)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
