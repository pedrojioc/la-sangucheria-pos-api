import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'

export class RemoveOrderItem {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(orderId: string, itemId: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.removeItem(itemId)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
