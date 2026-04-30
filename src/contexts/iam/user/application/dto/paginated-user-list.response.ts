import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { UserListResponse } from './user-list.response'

export class PaginatedUserListResponse {
  constructor(
    public readonly data: UserListResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
