import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateEmployeeCommand } from './create-employee.command'
import { CreateEmployee } from './create-employee'

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler implements ICommandHandler<CreateEmployeeCommand> {
  constructor(private readonly createEmployee: CreateEmployee) {}

  async execute(command: CreateEmployeeCommand): Promise<void> {
    await this.createEmployee.run(
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
