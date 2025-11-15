import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateProductCategoryCommand } from './update-product-category.command'
import { UpdateProductCategory } from './update-product-category'

@CommandHandler(UpdateProductCategoryCommand)
export class UpdateProductCategoryCommandHandler
  implements ICommandHandler<UpdateProductCategoryCommand>
{
  constructor(private readonly useCase: UpdateProductCategory) {}

  async execute(command: UpdateProductCategoryCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.description,
      command.icon,
      command.isActive,
      command.displayOrder
    )
  }
}
