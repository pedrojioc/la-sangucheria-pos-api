import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { EventBus } from '@shared/domain/events'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'

export class MarkOrderItemReady {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus,
    private readonly boardEmitter: KitchenBoardEventEmitter
  ) {}

  async run(orderId: string, itemId: string): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.markItemReady(itemId)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())

    const item = order.toPrimitives().items.find(i => i.id === itemId)!
    this.boardEmitter.notifyBoardUpdate(item.stationId)
  }
}
