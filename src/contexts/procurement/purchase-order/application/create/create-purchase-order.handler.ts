import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreatePurchaseOrderCommand } from './create-purchase-order.command'
import { CreatePurchaseOrder } from './create-purchase-order'

@CommandHandler(CreatePurchaseOrderCommand)
export class CreatePurchaseOrderHandler implements ICommandHandler<CreatePurchaseOrderCommand> {
  constructor(private readonly useCase: CreatePurchaseOrder) {}

  async execute(command: CreatePurchaseOrderCommand): Promise<void> {
    await this.useCase.run(
      command.id,
      command.orderNumber,
      command.supplierId,
      command.requestedBy,
      command.currency,
      command.expectedDeliveryDate,
      command.notes,
      command.items // ← Pasar items al use case
    )
  }
}
