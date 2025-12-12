import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateRecipeCommand } from './create-recipe.command'
import { CreateRecipe } from './create-recipe'

@CommandHandler(CreateRecipeCommand)
export class CreateRecipeHandler implements ICommandHandler<CreateRecipeCommand> {
  constructor(private readonly useCase: CreateRecipe) {}

  async execute(command: CreateRecipeCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.items,
      command.recipeYield,
      command.description
    )
  }
}
