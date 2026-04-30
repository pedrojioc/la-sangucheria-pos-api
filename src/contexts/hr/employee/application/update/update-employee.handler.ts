import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateEmployeeCommand } from './update-employee.command'
import { UpdateEmployee } from './update-employee'

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeHandler implements ICommandHandler<UpdateEmployeeCommand> {
  constructor(private readonly updateEmployee: UpdateEmployee) {}

  async execute(command: UpdateEmployeeCommand): Promise<void> {
    await this.updateEmployee.run(
      command.id,
      command.firstName,
      command.lastName,
      command.positionId,
      command.phone,
      command.email,
      command.address,
      command.hireDate,
      command.status,
      command.notes,
      command.salaryAmount,
      command.salaryBasis,
      command.paymentFrequency
    )
  }
}
