import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteRecipeCommand } from './delete-recipe.command'
import { DeleteRecipe } from './delete-recipe'

@CommandHandler(DeleteRecipeCommand)
export class DeleteRecipeHandler implements ICommandHandler<DeleteRecipeCommand> {
  constructor(private readonly useCase: DeleteRecipe) {}

  async execute(command: DeleteRecipeCommand): Promise<void> {
    return this.useCase.run(command.id)
  }
}
