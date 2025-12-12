import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateSupplierCommand } from './update-supplier.command'
import { UpdateSupplier } from './update-supplier'

@CommandHandler(UpdateSupplierCommand)
export class UpdateSupplierHandler implements ICommandHandler<UpdateSupplierCommand> {
  constructor(private readonly updateSupplier: UpdateSupplier) {}

  async execute(command: UpdateSupplierCommand): Promise<void> {
    await this.updateSupplier.run(
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
