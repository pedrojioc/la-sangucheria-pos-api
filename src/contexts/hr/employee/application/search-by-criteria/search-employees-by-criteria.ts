import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { EmployeeResponse } from '../dto/employee.response'
import { EmployeeQueryService } from '../services/employee-query.service'

export class SearchEmployeesByCriteria {
  constructor(private readonly queryService: EmployeeQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<EmployeeResponse>> {
    return this.queryService.search(criteria)
  }
}
