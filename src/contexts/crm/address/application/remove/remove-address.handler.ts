import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RemoveAddressCommand } from './remove-address.command'
import { RemoveAddress } from './remove-address'

@CommandHandler(RemoveAddressCommand)
export class RemoveAddressHandler implements ICommandHandler<RemoveAddressCommand> {
  constructor(private readonly removeAddress: RemoveAddress) {}

  async execute(command: RemoveAddressCommand): Promise<void> {
    await this.removeAddress.run(command.id, command.customerId)
  }
}
