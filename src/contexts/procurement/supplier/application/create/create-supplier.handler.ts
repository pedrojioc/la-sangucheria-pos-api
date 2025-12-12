import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateSupplierCommand } from './create-supplier.command'
import { CreateSupplier } from './create-supplier'

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  constructor(private readonly createSupplier: CreateSupplier) {}

  async execute(command: CreateSupplierCommand): Promise<void> {
    await this.createSupplier.run(
      command.id,
      command.name,
      command.contactName,
      command.email,
      command.phone,
      command.whatsappNumber,
      command.address,
      command.taxId,
      command.paymentTerms,
      command.notes,
      command.rating,
      command.isActive
    )
  }
}
