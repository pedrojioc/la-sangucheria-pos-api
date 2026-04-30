import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ActivateUserCommand } from './activate-user.command'
import { ActivateUser } from './activate-user'

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(private readonly useCase: ActivateUser) {}

  async execute(command: ActivateUserCommand): Promise<void> {
    await this.useCase.run(command.id)
  }
}
