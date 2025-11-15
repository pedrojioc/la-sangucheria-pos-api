import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SendPurchaseOrderCommand } from './send-purchase-order.command'
import { SendPurchaseOrder } from './send-purchase-order'

@CommandHandler(SendPurchaseOrderCommand)
export class SendPurchaseOrderHandler implements ICommandHandler<SendPurchaseOrderCommand> {
  constructor(private readonly useCase: SendPurchaseOrder) {}

  async execute(command: SendPurchaseOrderCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId, command.sentBy)
  }
}
