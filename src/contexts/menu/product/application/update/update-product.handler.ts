import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateProductCommand } from './update-product.command'
import { UpdateProduct } from './update-product'

@CommandHandler(UpdateProductCommand)
export class UpdateProductCommandHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(private readonly updateProduct: UpdateProduct) {}

  async execute(command: UpdateProductCommand): Promise<void> {
    return this.updateProduct.run(
      command.id,
      command.name,
      command.categoryId,
      command.price,
      command.inventoryStrategyType,
      command.description,
      command.ingredientId,
      command.imageFile,
      command.removeImage,
      command.preparationTime,
      command.displayOrder,
      command.tags
    )
  }
}
