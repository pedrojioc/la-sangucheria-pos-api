import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { CustomerListItemResponse } from './customer-list-item.response'

export class PaginatedCustomerListResponse {
  constructor(
    public readonly data: CustomerListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
