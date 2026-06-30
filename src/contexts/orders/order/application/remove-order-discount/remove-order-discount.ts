import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'

export class RemoveOrderDiscount {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder
  ) {}

  async run(orderId: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.removeOrderDiscount()
    await this.repository.save(order)
  }
}
