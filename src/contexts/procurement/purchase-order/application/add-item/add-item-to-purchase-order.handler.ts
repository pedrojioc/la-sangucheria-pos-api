import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AddItemToPurchaseOrderCommand } from './add-item-to-purchase-order.command'
import { AddItemToPurchaseOrder } from './add-item-to-purchase-order'

@CommandHandler(AddItemToPurchaseOrderCommand)
export class AddItemToPurchaseOrderHandler
  implements ICommandHandler<AddItemToPurchaseOrderCommand>
{
  constructor(private readonly useCase: AddItemToPurchaseOrder) {}

  async execute(command: AddItemToPurchaseOrderCommand): Promise<void> {
    await this.useCase.run(
      command.purchaseOrderId,
      command.itemId,
      command.ingredientId,
      command.quantityRequested,
      command.unitId,
      command.unitCost,
      command.currency,
      command.notes
    )
  }
}
