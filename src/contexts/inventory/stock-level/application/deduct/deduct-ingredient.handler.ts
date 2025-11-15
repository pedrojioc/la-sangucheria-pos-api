import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeductIngredientCommand } from './deduct-ingredient.command'
import { DeductIngredient } from './deduct-ingredient'

@CommandHandler(DeductIngredientCommand)
export class DeductIngredientHandler implements ICommandHandler<DeductIngredientCommand> {
  constructor(private readonly useCase: DeductIngredient) {}

  async execute(command: DeductIngredientCommand): Promise<void> {
    return this.useCase.run(
      command.ingredientId,
      command.quantity,
      command.unitId,
      command.reason,
      command.referenceId,
      command.performedBy
    )
  }
}
