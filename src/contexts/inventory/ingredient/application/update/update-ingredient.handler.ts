import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { Command } from '@/shared/application/bus/command'
import { UpdateIngredientCommand } from './update-ingredient.command'
import { UpdateIngredient } from './update-ingredient'

@Injectable()
@CommandHandler(UpdateIngredientCommand)
export class UpdateIngredientCommandHandler implements ICommandHandler<UpdateIngredientCommand> {
  constructor(private readonly updateIngredient: UpdateIngredient) {}

  subscribedTo(): Command {
    return UpdateIngredientCommand
  }

  async execute(command: UpdateIngredientCommand): Promise<void> {
    const {
      id,
      name,
      description,
      ingredientCategoryId,
      unitId,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    } = command

    await this.updateIngredient.run(
      id,
      name,
      description,
      ingredientCategoryId,
      unitId,
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
