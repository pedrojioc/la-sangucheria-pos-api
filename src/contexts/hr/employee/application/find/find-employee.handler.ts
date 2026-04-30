import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindEmployeeQuery } from './find-employee.query'
import { FindEmployee } from './find-employee'
import { EmployeeQueryService } from '../services/employee-query.service'
import { EmployeeResponse } from '../dto/employee.response'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { Filters } from '@/shared/domain/criteria/filters'
import { Filter } from '@/shared/domain/criteria/filter'
import { Order } from '@/shared/domain/criteria/order'
import { Pagination } from '@/shared/domain/criteria/pagination'

@QueryHandler(FindEmployeeQuery)
export class FindEmployeeHandler implements IQueryHandler<FindEmployeeQuery> {
  constructor(
    private readonly findEmployee: FindEmployee,
    private readonly employeeQueryService: EmployeeQueryService
  ) {}

  async execute(query: FindEmployeeQuery): Promise<EmployeeResponse> {
    await this.findEmployee.run(query.id)

    const criteria = new Criteria(
      new Filters([Filter.equal('id', query.id)]),
      Order.none(),
      new Pagination(1, 1)
    )

    const result = await this.employeeQueryService.search(criteria)
    const employee = result.data[0]

    if (!employee) throw new EmployeeNotExist(query.id)

    return employee
  }
}
