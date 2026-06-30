import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderCancelledEvent } from '../../domain/events/order-cancelled.event'
import { ReleaseTable } from '@contexts/restaurant/table/application/release/release-table'

@Injectable()
export class OnOrderCancelledReleaseTable implements DomainEventSubscriber<OrderCancelledEvent> {
  constructor(private readonly releaseTable: ReleaseTable) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderCancelledEvent]
  }

  async on(event: OrderCancelledEvent): Promise<void> {
    const { tableId } = event.toPrimitives()
    if (!tableId) return
    await this.releaseTable.run(tableId)
  }
}
