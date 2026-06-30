import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { OrderPurchaseOrderCommand } from './order-purchase-order.command'
import { OrderPurchaseOrder } from './order-purchase-order'

@CommandHandler(OrderPurchaseOrderCommand)
export class OrderPurchaseOrderHandler implements ICommandHandler<OrderPurchaseOrderCommand> {
  constructor(private readonly useCase: OrderPurchaseOrder) {}

  async execute(command: OrderPurchaseOrderCommand): Promise<void> {
    await this.useCase.run(
      command.purchaseOrderId,
      command.orderedBy,
      command.purchaseMethod,
      command.purchaseMethodDetails
    )
  }
}
