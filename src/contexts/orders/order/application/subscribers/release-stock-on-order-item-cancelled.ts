import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderItemCancelledEvent } from '../../domain/events/order-item-cancelled.event'
import { StockReservationPort } from '../ports/stock-reservation.port'

@Injectable()
export class ReleaseStockOnOrderItemCancelled
  implements DomainEventSubscriber<OrderItemCancelledEvent>
{
  constructor(private readonly stockReservationPort: StockReservationPort) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderItemCancelledEvent]
  }

  async on(event: OrderItemCancelledEvent): Promise<void> {
    const { orderId, itemId } = event.toPrimitives()
    await this.stockReservationPort.releaseForItem(orderId, itemId)
  }
}
