import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { ProductQueryService } from '../services/product-query.service'
import { ProductListItem } from '../dto/product-list-item'

export class SearchProductsByCriteria {
  constructor(private readonly queryService: ProductQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<ProductListItem>> {
    return this.queryService.search(criteria)
  }
}
