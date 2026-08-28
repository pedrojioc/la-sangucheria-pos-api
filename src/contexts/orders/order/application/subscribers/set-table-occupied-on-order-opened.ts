import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderOpenedEvent } from '../../domain/events/order-opened.event'
import { OrderType } from '../../domain/order-type'
import { OccupyTable } from '@contexts/restaurant/table/application/occupy/occupy-table'

@Injectable()
export class SetTableOccupiedOnOrderOpened implements DomainEventSubscriber<OrderOpenedEvent> {
  constructor(private readonly occupyTable: OccupyTable) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderOpenedEvent]
  }

  async on(event: OrderOpenedEvent): Promise<void> {
    const { orderId, type, tableId } = event.toPrimitives()
    if (type !== OrderType.DINE_IN || !tableId) return
    await this.occupyTable.run(tableId, orderId)
  }
}
