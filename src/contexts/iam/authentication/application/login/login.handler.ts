import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { LoginCommand } from './login.command'
import { Login, LoginResult } from './login'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(private readonly useCase: Login) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    return this.useCase.run(
      command.username,
      command.password,
      command.ipAddress,
      command.userAgent
    )
  }
}
