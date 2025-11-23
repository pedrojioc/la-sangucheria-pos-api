import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchIngredientsByCriteriaQuery } from './search-ingredients-by-criteria.query'
import { SearchIngredientsByCriteria } from './search-ingredients-by-criteria'
import { PaginatedIngredientListResponse } from '../dto/paginated-ingredient-list.response'
import { IngredientResponse } from '../dto/ingredient.response'

@QueryHandler(SearchIngredientsByCriteriaQuery)
export class SearchIngredientsByCriteriaHandler
  implements IQueryHandler<SearchIngredientsByCriteriaQuery>
{
  constructor(private readonly searchIngredientsByCriteria: SearchIngredientsByCriteria) {}

  async execute(query: SearchIngredientsByCriteriaQuery): Promise<PaginatedIngredientListResponse> {
    const result = await this.searchIngredientsByCriteria.run(
      query.page,
      query.pageSize,
      query.filters,
      query.orderBy,
      query.orderType
    )

    const items = result.data.map(ingredient => IngredientResponse.fromDomain(ingredient))

    return new PaginatedIngredientListResponse(items, result.meta)
  }
}
