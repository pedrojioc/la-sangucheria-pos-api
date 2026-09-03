import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterPurchaseCommand } from './register-purchase.command'
import { RegisterPurchase } from './register-purchase'

/**
 * RegisterPurchaseHandler
 *
 * Note: RegisterPurchase does not open its own transaction (see class doc on
 * RegisterPurchase). Today this handler's only dispatch path is
 * RegisterPurchaseOnItemReceived (a category-1 subscriber running inside the
 * transaction opened by @UseInterceptors(TransactionInterceptor) on
 * PurchaseOrderController.receive()). Any future endpoint that dispatches
 * RegisterPurchaseCommand directly MUST also carry
 * @UseInterceptors(TransactionInterceptor), or writes will not be atomic.
 */
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
      command.referenceCode
    )
  }
}
