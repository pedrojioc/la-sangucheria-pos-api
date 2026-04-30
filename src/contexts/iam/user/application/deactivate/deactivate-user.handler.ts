import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeactivateUserCommand } from './deactivate-user.command'
import { DeactivateUser } from './deactivate-user'

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  constructor(private readonly useCase: DeactivateUser) {}

  async execute(command: DeactivateUserCommand): Promise<void> {
    await this.useCase.run(command.id)
  }
}
