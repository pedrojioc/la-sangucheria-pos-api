import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreatePreparationRecipeCommand } from './create-preparation-recipe.command'
import { CreatePreparationRecipe } from './create-preparation-recipe'

@CommandHandler(CreatePreparationRecipeCommand)
export class CreatePreparationRecipeHandler implements ICommandHandler<CreatePreparationRecipeCommand> {
  constructor(private readonly useCase: CreatePreparationRecipe) {}

  async execute(command: CreatePreparationRecipeCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.baseIngredientId,
      command.outputIngredientId,
      command.yieldPercentage,
      command.additionalIngredients,
      command.description
    )
  }
}
