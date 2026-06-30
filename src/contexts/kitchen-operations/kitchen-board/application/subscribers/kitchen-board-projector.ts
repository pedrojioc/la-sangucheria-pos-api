import { DomainEvent, DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderItemReadyEvent } from '@contexts/orders/order/domain/events/order-item-ready.event'
import { OrderItemDeliveredEvent } from '@contexts/orders/order/domain/events/order-item-delivered.event'
import { OrderItemCancelledEvent } from '@contexts/orders/order/domain/events/order-item-cancelled.event'
import { KitchenBoardItemRepository } from '../../domain/kitchen-board-item.repository'
import { KitchenBoardEventEmitter } from '../services/kitchen-board-event-emitter'
import { Uuid } from '@shared/domain/value-objects/uuid'

export class KitchenBoardProjector implements DomainEventSubscriber<DomainEvent> {
  constructor(
    private readonly repository: KitchenBoardItemRepository,
    private readonly emitter: KitchenBoardEventEmitter
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [
      OrderSentToKitchenEvent,
      OrderItemReadyEvent,
      OrderItemDeliveredEvent,
      OrderItemCancelledEvent
    ]
  }

  async on(event: DomainEvent): Promise<void> {
    switch (event.eventName) {
      case OrderSentToKitchenEvent.EVENT_NAME:
        await this.onOrderSentToKitchen(event as OrderSentToKitchenEvent)
        break
      case OrderItemReadyEvent.EVENT_NAME:
        await this.onItemStatusChange(event as OrderItemReadyEvent, 'READY', {
          readyAt: new Date()
        })
        break
      case OrderItemDeliveredEvent.EVENT_NAME:
        await this.onItemStatusChange(event as OrderItemDeliveredEvent, 'DELIVERED', {
          deliveredAt: new Date()
        })
        break
      case OrderItemCancelledEvent.EVENT_NAME:
        await this.onItemStatusChange(event as OrderItemCancelledEvent, 'CANCELLED', {
          cancelledAt: new Date()
        })
        break
    }
  }

  private async onOrderSentToKitchen(event: OrderSentToKitchenEvent): Promise<void> {
    const payload = event.toPrimitives()
    const stationIds = new Set<string | null>()

    for (const item of payload.items) {
      await this.repository.upsert({
        id: Uuid.random().value,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber || String(payload.ticketNumber),
        itemId: item.itemId,
        itemName: item.productName,
        stationId: item.stationId,
        status: 'SENT',
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers ?? [],
        sentAt: payload.sentAt
      })

      stationIds.add(item.stationId)
    }

    for (const stationId of stationIds) {
      this.emitter.notifyBoardUpdate(stationId)
    }
  }

  private async onItemStatusChange(
    event: DomainEvent,
    status: string,
    timestamps: Partial<{ readyAt: Date; deliveredAt: Date; cancelledAt: Date }>
  ): Promise<void> {
    const payload = event.toPrimitives()
    const { itemId } = payload

    const exists = await this.repository.existsByItemId(itemId)
    if (!exists) return

    const stationId = await this.repository.findStationIdByItemId(itemId)
    await this.repository.updateStatus(itemId, status, timestamps)
    this.emitter.notifyBoardUpdate(stationId)
  }
}
