import { DomainEvent, DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { KitchenPrinterDispatcher } from '../kitchen-printer-dispatcher'

export class PrintKitchenTicketOnOrderSent implements DomainEventSubscriber<DomainEvent> {
  constructor(private readonly dispatcher: KitchenPrinterDispatcher) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderSentToKitchenEvent]
  }

  async on(event: DomainEvent): Promise<void> {
    await this.dispatcher.run(event as OrderSentToKitchenEvent)
  }
}
