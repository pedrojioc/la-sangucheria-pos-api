import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteProductCommand } from './delete-product.command'
import { DeleteProduct } from './delete-product'

@CommandHandler(DeleteProductCommand)
export class DeleteProductCommandHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(private readonly deleteProduct: DeleteProduct) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    return this.deleteProduct.run(command.id)
  }
}
