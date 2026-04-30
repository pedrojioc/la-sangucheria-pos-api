import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterManualAdjustmentCommand } from './register-manual-adjustment.command'
import { RegisterManualAdjustment } from './register-manual-adjustment'

@CommandHandler(RegisterManualAdjustmentCommand)
export class RegisterManualAdjustmentHandler
  implements ICommandHandler<RegisterManualAdjustmentCommand>
{
  constructor(private readonly useCase: RegisterManualAdjustment) {}

  async execute(command: RegisterManualAdjustmentCommand): Promise<{ id: string }> {
    const id = await this.useCase.run(
      command.ingredientId,
      command.type,
      command.quantity,
      command.note,
      command.performedBy
    )

    return { id }
  }
}
