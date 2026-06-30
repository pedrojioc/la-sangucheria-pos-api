import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'

export class RemoveItemDiscount {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder
  ) {}

  async run(orderId: string, itemId: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.removeItemDiscount(itemId)
    await this.repository.save(order)
  }
}
