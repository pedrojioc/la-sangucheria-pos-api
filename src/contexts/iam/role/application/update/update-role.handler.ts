import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateRoleCommand } from './update-role.command'
import { UpdateRole } from './update-role'

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(private readonly updateRole: UpdateRole) {}

  async execute(command: UpdateRoleCommand): Promise<void> {
    await this.updateRole.run(command.id, command.name, command.description)
  }
}
