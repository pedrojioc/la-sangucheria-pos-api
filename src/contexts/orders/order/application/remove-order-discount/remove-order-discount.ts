import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { EventBus } from '@shared/domain/events'

export class RemoveOrderDiscount {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(orderId: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.removeOrderDiscount()
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
