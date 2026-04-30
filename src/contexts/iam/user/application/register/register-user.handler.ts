import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RegisterUserCommand } from './register-user.command'
import { RegisterUser } from './register-user'

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly useCase: RegisterUser) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.username,
      command.email,
      command.password,
      command.fullName,
      command.roleId
    )
  }
}
