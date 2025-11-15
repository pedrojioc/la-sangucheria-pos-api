import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { Command } from '@/shared/application/bus/command'
import { CreateIngredientCategoryCommand } from './create-ingredient-category.command'
import { CreateIngredientCategory } from './create-ingredient-category'

@Injectable()
@CommandHandler(CreateIngredientCategoryCommand)
export class CreateIngredientCategoryCommandHandler
  implements ICommandHandler<CreateIngredientCategoryCommand>
{
  constructor(private readonly createIngredientCategory: CreateIngredientCategory) {}

  subscribedTo(): Command {
    return CreateIngredientCategoryCommand
  }

  async execute(command: CreateIngredientCategoryCommand): Promise<void> {
    const { id, name, description, icon, color, sortOrden, isActive } = command
    await this.createIngredientCategory.run(id, name, description, icon, color, sortOrden, isActive)
  }
}
