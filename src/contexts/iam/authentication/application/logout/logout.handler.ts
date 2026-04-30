import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { LogoutCommand } from './logout.command'
import { Logout } from './logout'

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(private readonly useCase: Logout) {}

  async execute(command: LogoutCommand): Promise<void> {
    return this.useCase.run(command.jti)
  }
}
