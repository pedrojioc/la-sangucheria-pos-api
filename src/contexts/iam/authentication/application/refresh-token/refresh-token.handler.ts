import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RefreshTokenCommand } from './refresh-token.command'
import { RefreshTokenUseCase, RefreshTokenResult } from './refresh-token'

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult>
{
  constructor(private readonly useCase: RefreshTokenUseCase) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    return this.useCase.run(
      command.refreshToken,
      command.userId,
      command.jti,
      command.ipAddress,
      command.userAgent
    )
  }
}
