import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { EventBus } from '@shared/domain/events'

export class CancelOrderItem {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(orderId: string, itemId: string, reason: string, cancelledBy: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.cancelItem(itemId, reason, cancelledBy)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
