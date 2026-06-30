import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CancelPurchaseOrderItemsCommand } from './cancel-purchase-order-items.command'
import { CancelPurchaseOrderItems } from './cancel-purchase-order-items'

@CommandHandler(CancelPurchaseOrderItemsCommand)
export class CancelPurchaseOrderItemsHandler
  implements ICommandHandler<CancelPurchaseOrderItemsCommand>
{
  constructor(private readonly useCase: CancelPurchaseOrderItems) {}

  async execute(command: CancelPurchaseOrderItemsCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId, command.itemId, command.reason)
  }
}
