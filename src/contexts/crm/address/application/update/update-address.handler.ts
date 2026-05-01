import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateAddressCommand } from './update-address.command'
import { UpdateAddress } from './update-address'

@CommandHandler(UpdateAddressCommand)
export class UpdateAddressHandler implements ICommandHandler<UpdateAddressCommand> {
  constructor(private readonly updateAddress: UpdateAddress) {}

  async execute(command: UpdateAddressCommand): Promise<void> {
    await this.updateAddress.run(
      command.id,
      command.label,
      command.street,
      command.neighborhood,
      command.city,
      command.reference,
      command.coordinates
    )
  }
}
