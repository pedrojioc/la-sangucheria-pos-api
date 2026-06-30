import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateProductCommand } from './create-product.command'
import { CreateProduct } from './create-product'

@CommandHandler(CreateProductCommand)
export class CreateProductCommandHandler implements ICommandHandler<CreateProductCommand> {
  constructor(private readonly createProduct: CreateProduct) {}

  async execute(command: CreateProductCommand): Promise<void> {
    return this.createProduct.run(
      command.id,
      command.name,
      command.categoryId,
      command.price,
      command.sku,
      command.inventoryStrategyType,
      command.description,
      command.ingredientId,
      command.imageFile,
      command.preparationTime,
      command.displayOrder,
      command.tags
    )
  }
}
