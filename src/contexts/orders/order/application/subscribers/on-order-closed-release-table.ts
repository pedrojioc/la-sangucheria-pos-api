import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderClosedEvent } from '../../domain/events/order-closed.event'
import { ReleaseTable } from '@contexts/restaurant/table/application/release/release-table'

@Injectable()
export class OnOrderClosedReleaseTable implements DomainEventSubscriber<OrderClosedEvent> {
  constructor(private readonly releaseTable: ReleaseTable) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderClosedEvent]
  }

  async on(event: OrderClosedEvent): Promise<void> {
    const { tableId } = event.toPrimitives()
    if (!tableId) return
    await this.releaseTable.run(tableId)
  }
}
