import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateUnitCommand } from './update-unit.command'
import { UpdateUnit } from './update-unit'

@CommandHandler(UpdateUnitCommand)
export class UpdateUnitCommandHandler implements ICommandHandler<UpdateUnitCommand> {
  constructor(private readonly useCase: UpdateUnit) {}

  async execute(command: UpdateUnitCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.symbol,
      command.type,
      command.isActive
    )
  }
}
