import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdatePositionCommand } from './update-position.command'
import { UpdatePosition } from './update-position'

@CommandHandler(UpdatePositionCommand)
export class UpdatePositionHandler implements ICommandHandler<UpdatePositionCommand> {
  constructor(private readonly updatePosition: UpdatePosition) {}

  async execute(command: UpdatePositionCommand): Promise<void> {
    await this.updatePosition.run(
      command.id,
      command.name,
      command.description,
      command.color,
      command.icon
    )
  }
}
