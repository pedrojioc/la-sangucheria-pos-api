import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { CustomerListItemResponse } from '../../presentation/http/dto/customer-list-item.response'

export class PaginatedCustomerListResponse {
  constructor(
    public readonly data: CustomerListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
