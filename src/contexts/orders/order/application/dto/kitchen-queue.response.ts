import { Order } from '../../domain/order'
import { OrderItemStatus } from '../../domain/order-item-status'

export interface KitchenQueueItem {
  itemId: string
  productName: string
  quantity: number
  notes: string | null
  status: string
  sentAt: Date | null
  readyAt: Date | null
}

export interface KitchenQueueOrder {
  orderId: string
  orderNumber: string
  tableId: string | null
  items: KitchenQueueItem[]
  oldestSentAt: Date | null
}

export class KitchenQueueResponse {
  constructor(public readonly orders: KitchenQueueOrder[]) {}

  static fromAggregates(orders: Order[]): KitchenQueueResponse {
    const queueOrders = orders.map(order => {
      const p = order.toPrimitives()
      const activeItems = p.items.filter(
        i => i.status === OrderItemStatus.SENT || i.status === OrderItemStatus.READY
      )
      const sentAts = activeItems.map(i => i.sentAt).filter((d): d is Date => d !== null)
      const oldestSentAt =
        sentAts.length > 0 ? sentAts.reduce((min, d) => (d < min ? d : min)) : null

      return {
        orderId: p.id,
        orderNumber: p.orderNumber,
        tableId: p.tableId,
        items: activeItems.map(i => ({
          itemId: i.id,
          productName: i.productName,
          quantity: i.quantity,
          notes: i.notes,
          status: i.status,
          sentAt: i.sentAt,
          readyAt: i.readyAt
        })),
        oldestSentAt
      }
    })

    queueOrders.sort((a, b) => {
      if (!a.oldestSentAt) return 1
      if (!b.oldestSentAt) return -1
      return a.oldestSentAt.getTime() - b.oldestSentAt.getTime()
    })

    return new KitchenQueueResponse(queueOrders)
  }
}
