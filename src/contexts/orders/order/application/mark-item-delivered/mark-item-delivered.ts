import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { EventBus } from '@shared/domain/events'
import { OrderStatus } from '../../domain/order-status'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'

export class MarkOrderItemDelivered {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus,
    private readonly boardEmitter: KitchenBoardEventEmitter
  ) {}

  async run(orderId: string, itemId: string, deliveredBy: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.markItemDelivered(itemId, deliveredBy)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())

    const primitives = order.toPrimitives()
    const item = primitives.items.find(i => i.id === itemId)!
    this.boardEmitter.notifyBoardUpdate(item.stationId)

    if (primitives.status === OrderStatus.READY) {
      this.boardEmitter.notifyBoardUpdate(null)
    }
  }
}
