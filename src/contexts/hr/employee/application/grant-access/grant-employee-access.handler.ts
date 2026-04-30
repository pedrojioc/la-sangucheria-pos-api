import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { GrantEmployeeAccessCommand } from './grant-employee-access.command'
import { GrantEmployeeAccess } from './grant-employee-access'

@CommandHandler(GrantEmployeeAccessCommand)
export class GrantEmployeeAccessHandler implements ICommandHandler<GrantEmployeeAccessCommand> {
  constructor(private readonly grantEmployeeAccess: GrantEmployeeAccess) {}

  async execute(command: GrantEmployeeAccessCommand): Promise<void> {
    await this.grantEmployeeAccess.run(
      command.employeeId,
      command.userId,
      command.username,
      command.email,
      command.password,
      command.roleId
    )
  }
}
