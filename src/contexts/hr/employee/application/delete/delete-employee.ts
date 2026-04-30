import { EmployeeRepository } from '../../domain/repositories/employee.repository'
import { EmployeeId } from '../../domain/employee-id'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'

export class DeleteEmployee {
  constructor(private readonly repository: EmployeeRepository) {}

  async run(id: string): Promise<void> {
    const employee = await this.repository.search(new EmployeeId(id))
    if (!employee) throw new EmployeeNotExist(id)
    await this.repository.delete(new EmployeeId(id))
  }
}
