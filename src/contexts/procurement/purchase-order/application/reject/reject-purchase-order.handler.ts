import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RejectPurchaseOrderCommand } from './reject-purchase-order.command'
import { RejectPurchaseOrder } from './reject-purchase-order'

@CommandHandler(RejectPurchaseOrderCommand)
export class RejectPurchaseOrderHandler implements ICommandHandler<RejectPurchaseOrderCommand> {
  constructor(private readonly useCase: RejectPurchaseOrder) {}

  async execute(command: RejectPurchaseOrderCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId, command.rejectedBy, command.reason)
  }
}
