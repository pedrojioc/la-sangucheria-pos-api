import { Employee } from '../../domain/employee'
import { EmployeeId } from '../../domain/employee-id'
import { EmployeeRepository } from '../../domain/repositories/employee.repository'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'

export class FindEmployee {
  constructor(private readonly repository: EmployeeRepository) {}

  async run(id: string): Promise<Employee> {
    const employee = await this.repository.search(new EmployeeId(id))
    if (!employee) throw new EmployeeNotExist(id)
    return employee
  }
}
