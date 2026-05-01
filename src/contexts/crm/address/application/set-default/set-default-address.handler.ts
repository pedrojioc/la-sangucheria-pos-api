import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SetDefaultAddressCommand } from './set-default-address.command'
import { SetDefaultAddress } from './set-default-address'

@CommandHandler(SetDefaultAddressCommand)
export class SetDefaultAddressHandler implements ICommandHandler<SetDefaultAddressCommand> {
  constructor(private readonly setDefaultAddress: SetDefaultAddress) {}

  async execute(command: SetDefaultAddressCommand): Promise<void> {
    await this.setDefaultAddress.run(command.addressId, command.customerId)
  }
}
