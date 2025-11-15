import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { ProductResponse } from './product.response'

export class PaginatedProductListResponse {
  constructor(
    public readonly data: ProductResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
