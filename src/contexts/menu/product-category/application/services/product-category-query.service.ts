import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { ProductCategoryListItem } from '../dto/product-category-list-item'

export abstract class ProductCategoryQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<ProductCategoryListItem>>
}
