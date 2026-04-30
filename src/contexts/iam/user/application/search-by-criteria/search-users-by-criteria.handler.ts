import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchUsersByCriteriaQuery } from './search-users-by-criteria.query'
import { SearchUsersByCriteria } from './search-users-by-criteria'
import { PaginatedUserListResponse } from '../dto/paginated-user-list.response'

@QueryHandler(SearchUsersByCriteriaQuery)
export class SearchUsersByCriteriaHandler
  implements IQueryHandler<SearchUsersByCriteriaQuery>
{
  constructor(private readonly useCase: SearchUsersByCriteria) {}

  async execute(query: SearchUsersByCriteriaQuery): Promise<PaginatedUserListResponse> {
    const result = await this.useCase.run(query.criteria)
    return new PaginatedUserListResponse(result.data, result.meta)
  }
}
