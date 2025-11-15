import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterTransformationCommand } from './register-transformation.command'
import { RegisterTransformation } from './register-transformation'

@CommandHandler(RegisterTransformationCommand)
export class RegisterTransformationHandler
  implements ICommandHandler<RegisterTransformationCommand>
{
  constructor(private readonly useCase: RegisterTransformation) {}

  async execute(command: RegisterTransformationCommand): Promise<void> {
    return this.useCase.run(
      command.transformationId,
      command.recipeId,
      command.inputQuantity,
      command.inputUnitId,
      command.outputQuantity,
      command.outputUnitId,
      command.performedBy,
      command.notes
    )
  }
}
