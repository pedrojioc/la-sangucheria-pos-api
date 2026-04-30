import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateRoleCommand } from './create-role.command'
import { CreateRole } from './create-role'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(private readonly createRole: CreateRole) {}

  async execute(command: CreateRoleCommand): Promise<void> {
    await this.createRole.run(command.id, command.name, command.description)
  }
}
