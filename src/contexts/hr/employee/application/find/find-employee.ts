import { EmployeeQueryService } from '../services/employee-query.service'
import { EmployeeResponse } from '../dto/employee.response'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'

export class FindEmployee {
  constructor(private readonly queryService: EmployeeQueryService) {}

  async run(id: string): Promise<EmployeeResponse> {
    const employee = await this.queryService.findById(id)

    if (!employee) throw new EmployeeNotExist(id)

    return employee
  }
}
