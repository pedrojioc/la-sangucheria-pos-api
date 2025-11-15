import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteProductCategoryCommand } from './delete-product-category.command'
import { DeleteProductCategory } from './delete-product-category'

@CommandHandler(DeleteProductCategoryCommand)
export class DeleteProductCategoryCommandHandler
  implements ICommandHandler<DeleteProductCategoryCommand>
{
  constructor(private readonly useCase: DeleteProductCategory) {}

  async execute(command: DeleteProductCategoryCommand): Promise<void> {
    return this.useCase.run(command.id)
  }
}
