import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteRoleCommand } from './delete-role.command'
import { DeleteRole } from './delete-role'

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(private readonly deleteRole: DeleteRole) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    await this.deleteRole.run(command.id)
  }
}
