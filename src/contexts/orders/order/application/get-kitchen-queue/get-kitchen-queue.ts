import { OrderRepository } from '../../domain/repositories/order.repository'
import { KitchenQueueResponse } from '../dto/kitchen-queue.response'

export class GetKitchenQueue {
  constructor(private readonly repository: OrderRepository) {}

  async run(): Promise<KitchenQueueResponse> {
    const orders = await this.repository.searchWithActiveKitchenItems()
    return KitchenQueueResponse.fromAggregates(orders)
  }
}
