import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdatePurchaseOrderCommand } from './update-purchase-order.command'
import { UpdatePurchaseOrder } from './update-purchase-order'

/**
 * UpdatePurchaseOrderHandler
 *
 * CQRS Command Handler that adapts the UpdatePurchaseOrderCommand
 * to the UpdatePurchaseOrder use case.
 *
 * This is a thin adapter layer that delegates to the pure use case.
 */
@CommandHandler(UpdatePurchaseOrderCommand)
export class UpdatePurchaseOrderHandler implements ICommandHandler<UpdatePurchaseOrderCommand> {
  constructor(private readonly useCase: UpdatePurchaseOrder) {}

  async execute(command: UpdatePurchaseOrderCommand): Promise<void> {
    return this.useCase.run(
      command.purchaseOrderId,
      command.supplierId,
      command.expectedDeliveryDate,
      command.notes,
      command.items
    )
  }
}
