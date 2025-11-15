import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterPurchaseCommand } from './register-purchase.command'
import { RegisterPurchase } from './register-purchase'

@CommandHandler(RegisterPurchaseCommand)
export class RegisterPurchaseHandler implements ICommandHandler<RegisterPurchaseCommand> {
  constructor(private readonly useCase: RegisterPurchase) {}

  async execute(command: RegisterPurchaseCommand): Promise<void> {
    return this.useCase.run(
      command.batchId,
      command.ingredientId,
      command.quantity,
      command.unitId,
      command.unitCost,
      command.currency,
      command.purchaseDate,
      command.expirationDate,
      command.supplier,
      command.referenceCode,
      command.performedBy
    )
  }
}
