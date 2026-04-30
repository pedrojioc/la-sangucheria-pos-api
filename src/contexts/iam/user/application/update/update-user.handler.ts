import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateUserCommand } from './update-user.command'
import { UpdateUser } from './update-user'

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly useCase: UpdateUser) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    await this.useCase.run(
      command.id,
      command.username,
      command.email,
      command.fullName,
      command.roleId
    )
  }
}
