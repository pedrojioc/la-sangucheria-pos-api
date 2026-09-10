import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderCancelledEvent } from '../../domain/events/order-cancelled.event'
import { StockReservationPort } from '../ports/stock-reservation.port'

@Injectable()
export class ReleaseStockOnOrderCancelled implements DomainEventSubscriber<OrderCancelledEvent> {
  constructor(private readonly stockReservationPort: StockReservationPort) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderCancelledEvent]
  }

  async on(event: OrderCancelledEvent): Promise<void> {
    const { orderId } = event.toPrimitives()
    await this.stockReservationPort.releaseForOrder(orderId)
  }
}
