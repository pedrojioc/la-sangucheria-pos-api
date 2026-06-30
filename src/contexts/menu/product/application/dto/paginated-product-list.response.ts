import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { ProductListItemResponse } from './product-list-item.response'

export class PaginatedProductListResponse {
  constructor(
    public readonly data: ProductListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
