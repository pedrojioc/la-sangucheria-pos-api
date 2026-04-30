import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteEmployeeCommand } from './delete-employee.command'
import { DeleteEmployee } from './delete-employee'

@CommandHandler(DeleteEmployeeCommand)
export class DeleteEmployeeHandler implements ICommandHandler<DeleteEmployeeCommand> {
  constructor(private readonly deleteEmployee: DeleteEmployee) {}

  async execute(command: DeleteEmployeeCommand): Promise<void> {
    await this.deleteEmployee.run(command.id)
  }
}
