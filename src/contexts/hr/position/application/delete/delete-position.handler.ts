import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeletePositionCommand } from './delete-position.command'
import { DeletePosition } from './delete-position'

@CommandHandler(DeletePositionCommand)
export class DeletePositionHandler implements ICommandHandler<DeletePositionCommand> {
  constructor(private readonly deletePosition: DeletePosition) {}

  async execute(command: DeletePositionCommand): Promise<void> {
    await this.deletePosition.run(command.id)
  }
}
