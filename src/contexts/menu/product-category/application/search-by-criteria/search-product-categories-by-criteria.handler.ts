import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchProductCategoriesByCriteriaQuery } from './search-product-categories-by-criteria.query'
import { SearchProductCategoriesByCriteria } from './search-product-categories-by-criteria'
import { PaginatedProductCategoryListResponse } from '../dto/paginated-product-category-list.response'
import { ProductCategoryListItemResponse } from '../dto/product-category-list-item.response'

@QueryHandler(SearchProductCategoriesByCriteriaQuery)
export class SearchProductCategoriesByCriteriaHandler
  implements IQueryHandler<SearchProductCategoriesByCriteriaQuery>
{
  constructor(private readonly useCase: SearchProductCategoriesByCriteria) {}

  async execute(
    query: SearchProductCategoriesByCriteriaQuery
  ): Promise<PaginatedProductCategoryListResponse> {
    const result = await this.useCase.run(query.criteria)

    const data = result.data.map(item => ProductCategoryListItemResponse.fromReadModel(item))

    return new PaginatedProductCategoryListResponse(data, result.meta)
  }
}
