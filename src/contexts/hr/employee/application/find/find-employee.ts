import { EmployeeQueryService } from '../services/employee-query.service'
import { EmployeeResponse } from '../dto/employee.response'
import { EmployeeNotExist } from '../../domain/exceptions/employee-not-exist.exception'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { Filters } from '@/shared/domain/criteria/filters'
import { Filter } from '@/shared/domain/criteria/filter'
import { Order } from '@/shared/domain/criteria/order'
import { Pagination } from '@/shared/domain/criteria/pagination'

export class FindEmployee {
  constructor(private readonly queryService: EmployeeQueryService) {}

  async run(id: string): Promise<EmployeeResponse> {
    const criteria = new Criteria(
      new Filters([Filter.equal('id', id)]),
      Order.none(),
      new Pagination(1, 1)
    )

    const result = await this.queryService.search(criteria)
    const employee = result.data[0]

    if (!employee) throw new EmployeeNotExist(id)

    return employee
  }
}
