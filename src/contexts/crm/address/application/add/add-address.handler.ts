import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AddAddressCommand } from './add-address.command'
import { AddAddress } from './add-address'

@CommandHandler(AddAddressCommand)
export class AddAddressHandler implements ICommandHandler<AddAddressCommand> {
  constructor(private readonly addAddress: AddAddress) {}

  async execute(command: AddAddressCommand): Promise<void> {
    await this.addAddress.run(
      command.id,
      command.customerId,
      command.label,
      command.street,
      command.neighborhood,
      command.city,
      command.reference,
      command.coordinates
    )
  }
}
