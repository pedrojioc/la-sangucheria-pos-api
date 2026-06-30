import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateProductCategoryCommand } from './create-product-category.command'
import { Injectable } from '@nestjs/common'
import { CreateProductCategory } from './create-product-category'
import { Command } from '@/shared/application/bus/command'

@Injectable()
@CommandHandler(CreateProductCategoryCommand)
export class CreateProductCategoryHandler implements ICommandHandler<CreateProductCategoryCommand> {
  constructor(private readonly createProductCategory: CreateProductCategory) {}

  subscribedTo(): Command {
    return CreateProductCategoryCommand
  }

  async execute(command: CreateProductCategoryCommand): Promise<void> {
    const { id, name, description, icon, color, isActive, displayOrder, defaultStationId } = command
    await this.createProductCategory.run(
      id,
      name,
      description,
      icon,
      color,
      isActive,
      displayOrder,
      defaultStationId
    )
  }
}
