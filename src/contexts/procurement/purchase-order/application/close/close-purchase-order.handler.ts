import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ClosePurchaseOrderCommand } from './close-purchase-order.command'
import { ClosePurchaseOrder } from './close-purchase-order'

@CommandHandler(ClosePurchaseOrderCommand)
export class ClosePurchaseOrderHandler implements ICommandHandler<ClosePurchaseOrderCommand> {
  constructor(private readonly useCase: ClosePurchaseOrder) {}

  async execute(command: ClosePurchaseOrderCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId, command.closedBy)
  }
}
