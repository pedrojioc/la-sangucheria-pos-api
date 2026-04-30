import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterItemReceptionCommand } from './register-item-reception.command'
import { RegisterItemReception } from './register-item-reception'

@CommandHandler(RegisterItemReceptionCommand)
export class RegisterItemReceptionHandler implements ICommandHandler<RegisterItemReceptionCommand> {
  constructor(private readonly useCase: RegisterItemReception) {}

  async execute(command: RegisterItemReceptionCommand): Promise<void> {
    await this.useCase.run(
      command.purchaseOrderId,
      command.items,
      command.notes,
      command.closeOrder,
      command.receivedBy
    )
  }
}
