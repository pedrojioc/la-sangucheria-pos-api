import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateProductCommand } from './create-product.command'
import { CreateProduct } from './create-product'

/**
 * Handler for CreateProductCommand.
 *
 * This handler acts as an adapter between the Presentation layer and the Application layer.
 * It transforms infrastructure types (Express.Multer.File) to domain types (FileUpload)
 * before calling the use case.
 *
 * This is the correct place for this transformation in Onion Architecture.
 */
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
      command.description,
      command.recipeId,
      command.imageFile,
      command.preparationTime,
      command.displayOrder,
      command.tags
    )
  }
}
