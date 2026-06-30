import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { ProductListItem } from '../dto/product-list-item'

export abstract class ProductQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<ProductListItem>>
}
