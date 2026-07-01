import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'

export interface CloseOrderPaymentInput {
  method: 'CASH' | 'CARD' | 'TRANSFER'
  amount: number
}

export interface CloseOrderSplitInput {
  label: string
  itemIds: string[]
  payment: CloseOrderPaymentInput
}

export class CloseOrder {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus
  ) {}

  async run(
    orderId: string,
    payments: CloseOrderPaymentInput[],
    closedBy: string,
    tip?: number | null,
    splits?: CloseOrderSplitInput[] | null,
    customerDocumentType?: string,
    customerDocumentNumber?: string
  ): Promise<void> {
    const order = await this.findOrder.run(orderId)
    order.close(
      payments,
      closedBy,
      tip,
      splits,
      customerDocumentType ?? null,
      customerDocumentNumber ?? null
    )
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }
}
