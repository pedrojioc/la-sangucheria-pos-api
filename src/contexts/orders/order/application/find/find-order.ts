import { OrderRepository } from '../../domain/repositories/order.repository'
import { OrderId } from '../../domain/order-id'
import { Order } from '../../domain/order'
import { OrderNotExist } from '../../domain/exceptions/order-not-exist.exception'

export class FindOrder {
  constructor(private readonly repository: OrderRepository) {}

  async run(id: string): Promise<Order> {
    const order = await this.repository.search(new OrderId(id))
    if (!order) {
      throw new OrderNotExist(id)
    }
    return order
  }
}
