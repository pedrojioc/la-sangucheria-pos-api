import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateCustomerCommand } from './update-customer.command'
import { UpdateCustomer } from './update-customer'

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(private readonly updateCustomer: UpdateCustomer) {}

  async execute(command: UpdateCustomerCommand): Promise<void> {
    await this.updateCustomer.run(
      command.id,
      command.name,
      command.phone,
      command.email,
      command.taxRegime,
      command.notes
    )
  }
}
