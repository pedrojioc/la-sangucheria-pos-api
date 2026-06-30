import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { AddItemInput } from '../../domain/order'

export class AddOrderItems {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(orderId: string, items: AddItemInput[]): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.addItems(items)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
