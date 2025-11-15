import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateProductCommand } from './update-product.command'
import { UpdateProduct } from './update-product'

/**
 * Handler for UpdateProductCommand.
 *
 * This handler acts as an adapter between the Presentation layer and the Application layer.
 * It transforms infrastructure types (Express.Multer.File) to domain types (FileUpload)
 * before calling the use case.
 */
@CommandHandler(UpdateProductCommand)
export class UpdateProductCommandHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(private readonly updateProduct: UpdateProduct) {}

  async execute(command: UpdateProductCommand): Promise<void> {
    // Transform infrastructure file type to domain VO

    return this.updateProduct.run(
      command.id,
      command.name,
      command.categoryId,
      command.price,
      command.description,
      command.recipeId,
      command.imageFile,
      command.removeImage,
      command.preparationTime,
      command.displayOrder,
      command.tags
    )
  }
}
