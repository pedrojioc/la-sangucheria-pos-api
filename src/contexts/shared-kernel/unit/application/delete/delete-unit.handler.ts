import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteUnitCommand } from './delete-unit.command'
import { DeleteUnit } from './delete-unit'

@CommandHandler(DeleteUnitCommand)
export class DeleteUnitCommandHandler implements ICommandHandler<DeleteUnitCommand> {
  constructor(private readonly useCase: DeleteUnit) {}

  async execute(command: DeleteUnitCommand): Promise<void> {
    return this.useCase.run(command.id)
  }
}
