import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ApprovePurchaseOrderCommand } from './approve-purchase-order.command'
import { ApprovePurchaseOrder } from './approve-purchase-order'

@CommandHandler(ApprovePurchaseOrderCommand)
export class ApprovePurchaseOrderHandler implements ICommandHandler<ApprovePurchaseOrderCommand> {
  constructor(private readonly useCase: ApprovePurchaseOrder) {}

  async execute(command: ApprovePurchaseOrderCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId, command.approvedBy)
  }
}
