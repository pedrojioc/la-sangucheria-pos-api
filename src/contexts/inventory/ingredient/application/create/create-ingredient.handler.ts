import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { Command } from '@/shared/application/bus/command'
import { CreateIngredientCommand } from './create-ingredient.command'
import { CreateIngredient } from './create-ingredient'

@Injectable()
@CommandHandler(CreateIngredientCommand)
export class CreateIngredientCommandHandler implements ICommandHandler<CreateIngredientCommand> {
  constructor(private readonly createIngredient: CreateIngredient) {}

  subscribedTo(): Command {
    return CreateIngredientCommand
  }

  async execute(command: CreateIngredientCommand): Promise<void> {
    const {
      id,
      name,
      description,
      ingredientCategoryId,
      baseUnit,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    } = command

    await this.createIngredient.run(
      id,
      name,
      description,
      ingredientCategoryId,
      baseUnit,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    )
  }
}
