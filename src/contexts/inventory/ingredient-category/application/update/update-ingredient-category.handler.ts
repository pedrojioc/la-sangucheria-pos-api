import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { Command } from '@/shared/application/bus/command'
import { UpdateIngredientCategoryCommand } from './update-ingredient-category.command'
import { UpdateIngredientCategory } from './update-ingredient-category'

@Injectable()
@CommandHandler(UpdateIngredientCategoryCommand)
export class UpdateIngredientCategoryCommandHandler
  implements ICommandHandler<UpdateIngredientCategoryCommand>
{
  constructor(private readonly updateIngredientCategory: UpdateIngredientCategory) {}

  subscribedTo(): Command {
    return UpdateIngredientCategoryCommand
  }

  async execute(command: UpdateIngredientCategoryCommand): Promise<void> {
    const { id, name, description, icon, color, sortOrder, isActive } = command
    await this.updateIngredientCategory.run(id, name, description, icon, color, sortOrder, isActive)
  }
}
