import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreatePositionCommand } from './create-position.command'
import { CreatePosition } from './create-position'

@CommandHandler(CreatePositionCommand)
export class CreatePositionHandler implements ICommandHandler<CreatePositionCommand> {
  constructor(private readonly createPosition: CreatePosition) {}

  async execute(command: CreatePositionCommand): Promise<void> {
    await this.createPosition.run(command.id, command.name, command.description, command.color, command.icon)
  }
}
