import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { Order } from '../../domain/order'
import { OrderType } from '../../domain/order-type'

export class OpenOrder {
  constructor(
    private readonly repository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    type: OrderType,
    openedBy: string,
    notes: string | null,
    tableId?: string | null,
    customerId?: string | null,
    addressId?: string | null,
    deliveryFee?: number | null,
    currency?: string
  ): Promise<string> {
    const orderNumber = await this.repository.nextOrderNumber(new Date())

    const order = Order.create(
      id,
      orderNumber,
      type,
      openedBy,
      notes,
      tableId,
      customerId,
      addressId,
      deliveryFee,
      currency
    )

    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())

    return orderNumber
  }
}
