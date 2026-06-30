import { Order } from '../order'
import { OrderId } from '../order-id'

export abstract class OrderRepository {
  abstract save(order: Order): Promise<void>
  abstract search(id: OrderId): Promise<Order | null>
  abstract nextOrderNumber(date: Date): Promise<string>
  abstract searchWithActiveKitchenItems(): Promise<Order[]>
}
