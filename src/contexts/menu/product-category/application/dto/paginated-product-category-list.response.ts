import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { ProductCategoryListItemResponse } from './product-category-list-item.response'

export class PaginatedProductCategoryListResponse {
  constructor(
    public readonly data: ProductCategoryListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
