import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchProductsByCriteriaQuery } from './search-products-by-criteria.query'
import { SearchProductsByCriteria } from './search-products-by-criteria'
import { PaginatedProductListResponse } from '../dto/paginated-product-list.response'
import { ProductResponse } from '../dto/product.response'

@QueryHandler(SearchProductsByCriteriaQuery)
export class SearchProductsByCriteriaHandler
  implements IQueryHandler<SearchProductsByCriteriaQuery>
{
  constructor(private readonly searchProductsByCriteria: SearchProductsByCriteria) {}

  async execute(query: SearchProductsByCriteriaQuery): Promise<PaginatedProductListResponse> {
    const result = await this.searchProductsByCriteria.run(query.criteria)

    const items = result.data.map(product => ProductResponse.fromDomain(product))

    return new PaginatedProductListResponse(items, result.meta)
  }
}
