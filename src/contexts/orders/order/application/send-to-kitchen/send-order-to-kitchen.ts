import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { OrderItemStationUnresolved } from '../../domain/exceptions/order-item-station-unresolved.exception'
import { FindOrder } from '../find/find-order'
import { StationRoutingPort } from '../ports/station-routing.port'
import { TableLabelPort } from '../ports/table-label.port'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'

export class SendOrderToKitchen {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus,
    private readonly stationRouting: StationRoutingPort,
    private readonly tableLabelPort: TableLabelPort,
    private readonly boardEmitter: KitchenBoardEventEmitter
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

    this.assertAllStationsResolved(pendingItems, stationAssignments)

    const tableId = primitives.tableId
    const tableLabel = tableId !== null ? await this.tableLabelPort.findLabelById(tableId) : null

    order.sendToKitchen(ticketId, itemIds, sentBy, stationAssignments, tableId, tableLabel)
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())

    const distinctStationIds = new Set(stationAssignments.values())
    for (const stationId of distinctStationIds) {
      this.boardEmitter.notifyBoardUpdate(stationId ?? null)
    }
  }

  // Station routing is resolved from product_categories.default_station_id. A
  // missing key or a null value means the category is unconfigured — sending
  // would silently drop the item at KitchenPrinterDispatcher. Reject the whole
  // batch before the aggregate mutates so nothing is saved or published.
  private assertAllStationsResolved(
    pendingItems: { productId: string }[],
    stationAssignments: Map<string, string | null>
  ): void {
    const unresolvedProductIds = pendingItems
      .map(item => item.productId)
      .filter(productId => !stationAssignments.get(productId))

    if (unresolvedProductIds.length === 0) return

    // Product IDs are logged server-side only; the exception message stays
    // generic so FOH staff never see internal identifiers.
    console.error('SendOrderToKitchen: unresolved station routing', {
      unresolvedProductIds
    })

    throw new OrderItemStationUnresolved()
  }
}
