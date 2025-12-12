import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateRecipeCommand } from './update-recipe.command'
import { UpdateRecipe } from './update-recipe'

@CommandHandler(UpdateRecipeCommand)
export class UpdateRecipeHandler implements ICommandHandler<UpdateRecipeCommand> {
  constructor(private readonly useCase: UpdateRecipe) {}

  async execute(command: UpdateRecipeCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.items,
      command.recipeYield,
      command.description
    )
  }
}
