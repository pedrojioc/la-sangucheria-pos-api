import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'

export class PaginatedResponse<T> {
  constructor(
    public readonly data: T[],
    public readonly meta: PaginationMeta
  ) {}
}
