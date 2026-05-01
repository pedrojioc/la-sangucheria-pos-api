import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateCustomerCommand } from './create-customer.command'
import { CreateCustomer } from './create-customer'

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(private readonly createCustomer: CreateCustomer) {}

  async execute(command: CreateCustomerCommand): Promise<void> {
    await this.createCustomer.run(
      command.id,
      command.name,
      command.phone,
      command.email,
      command.documentType,
      command.documentNumber,
      command.taxRegime,
      command.notes
    )
  }
}
