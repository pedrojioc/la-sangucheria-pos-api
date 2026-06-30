import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { ProductCategoryQueryService } from '../services/product-category-query.service'
import { ProductCategoryListItem } from '../dto/product-category-list-item'

export class SearchProductCategoriesByCriteria {
  constructor(private readonly queryService: ProductCategoryQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<ProductCategoryListItem>> {
    return await this.queryService.search(criteria)
  }
}
