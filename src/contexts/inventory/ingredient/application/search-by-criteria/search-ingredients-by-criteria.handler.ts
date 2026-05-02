import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchIngredientsByCriteriaQuery } from './search-ingredients-by-criteria.query'
import { SearchIngredientsByCriteria } from './search-ingredients-by-criteria'
import { PaginatedIngredientListResponse } from '../dto/paginated-ingredient-list.response'
import { IngredientListItemResponse } from '../../presentation/http/dto/ingredient-list-item.response'

@QueryHandler(SearchIngredientsByCriteriaQuery)
export class SearchIngredientsByCriteriaHandler
  implements IQueryHandler<SearchIngredientsByCriteriaQuery>
{
  constructor(private readonly searchIngredientsByCriteria: SearchIngredientsByCriteria) {}

  async execute(query: SearchIngredientsByCriteriaQuery): Promise<PaginatedIngredientListResponse> {
    const result = await this.searchIngredientsByCriteria.run(query.criteria)
    const data = result.data.map(item => IngredientListItemResponse.fromReadModel(item))
    return new PaginatedIngredientListResponse(data, result.meta)
  }
}
