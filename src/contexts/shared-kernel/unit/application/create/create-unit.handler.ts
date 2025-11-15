import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateUnitCommand } from './create-unit.command'
import { CreateUnit } from './create-unit'

@CommandHandler(CreateUnitCommand)
export class CreateUnitCommandHandler implements ICommandHandler<CreateUnitCommand> {
  constructor(private readonly useCase: CreateUnit) {}

  async execute(command: CreateUnitCommand): Promise<void> {
    return this.useCase.run(
      command.id,
      command.name,
      command.symbol,
      command.type,
      command.isActive
    )
  }
}
