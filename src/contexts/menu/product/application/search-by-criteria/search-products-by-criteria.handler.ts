import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchProductsByCriteriaQuery } from './search-products-by-criteria.query'
import { SearchProductsByCriteria } from './search-products-by-criteria'
import { PaginatedProductListResponse } from '../dto/paginated-product-list.response'
import { ProductListItemResponse } from '../dto/product-list-item.response'

@QueryHandler(SearchProductsByCriteriaQuery)
export class SearchProductsByCriteriaHandler
  implements IQueryHandler<SearchProductsByCriteriaQuery>
{
  constructor(private readonly searchProductsByCriteria: SearchProductsByCriteria) {}

  async execute(query: SearchProductsByCriteriaQuery): Promise<PaginatedProductListResponse> {
    const result = await this.searchProductsByCriteria.run(query.criteria)
    const data = result.data.map(item => ProductListItemResponse.fromReadModel(item))
    return new PaginatedProductListResponse(data, result.meta)
  }
}
