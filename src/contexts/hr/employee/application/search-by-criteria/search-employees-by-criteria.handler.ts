import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchEmployeesByCriteriaQuery } from './search-employees-by-criteria.query'
import { SearchEmployeesByCriteria } from './search-employees-by-criteria'
import { PaginatedEmployeeListResponse } from '../dto/paginated-employee-list.response'

@QueryHandler(SearchEmployeesByCriteriaQuery)
export class SearchEmployeesByCriteriaHandler
  implements IQueryHandler<SearchEmployeesByCriteriaQuery>
{
  constructor(private readonly useCase: SearchEmployeesByCriteria) {}

  async execute(query: SearchEmployeesByCriteriaQuery): Promise<PaginatedEmployeeListResponse> {
    const result = await this.useCase.run(query.criteria)
    return new PaginatedEmployeeListResponse(result.data, result.meta)
  }
}
