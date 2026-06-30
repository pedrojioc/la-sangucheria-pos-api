import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { StationRoutingPort } from '../ports/station-routing.port'
import { TableLabelPort } from '../ports/table-label.port'

export class SendOrderToKitchen {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus,
    private readonly stationRouting: StationRoutingPort,
    private readonly tableLabelPort: TableLabelPort
  ) {}

  async run(orderId: string, ticketId: string, itemIds: string[], sentBy: string): Promise<void> {
    const order = await this.findOrder.run(orderId)

    const primitives = order.toPrimitives()
    const pendingItems = primitives.items.filter(
      i => i.status === 'PENDING' && itemIds.includes(i.id)
    )

    const routableItems = pendingItems.map(item => ({
      productId: item.productId
    }))

    const stationAssignments = await this.stationRouting.resolveStations(routableItems)

    const tableId = primitives.tableId
    const tableLabel = tableId !== null ? await this.tableLabelPort.findLabelById(tableId) : null

    order.sendToKitchen(ticketId, itemIds, sentBy, stationAssignments, tableId, tableLabel)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
