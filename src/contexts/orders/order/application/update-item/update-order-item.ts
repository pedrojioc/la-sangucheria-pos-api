import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'

export class UpdateOrderItem {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder
  ) {}

  async run(
    orderId: string,
    itemId: string,
    quantity?: number,
    notes?: string | null
  ): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.updateItem(itemId, quantity, notes)
    await this.repository.save(order)
  }
}
