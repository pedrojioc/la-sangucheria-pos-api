import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { UserListResponse } from '../dto/user-list.response'

export abstract class UserQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<UserListResponse>>
}
