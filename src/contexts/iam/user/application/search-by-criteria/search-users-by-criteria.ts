import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { UserListResponse } from '../dto/user-list.response'
import { UserQueryService } from '../services/user-query.service'

export class SearchUsersByCriteria {
  constructor(private readonly queryService: UserQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<UserListResponse>> {
    return this.queryService.search(criteria)
  }
}
