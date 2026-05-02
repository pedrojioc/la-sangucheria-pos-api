import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchPreparationRecipesByCriteriaQuery } from './search-preparation-recipes-by-criteria.query'
import { SearchPreparationRecipesByCriteria } from './search-preparation-recipes-by-criteria'
import { PaginatedPreparationRecipeListResponse } from '../dto/paginated-preparation-recipe-list.response'
import { PreparationRecipeListItemResponse } from '../../presentation/http/dto/preparation-recipe-list-item.response'

@QueryHandler(SearchPreparationRecipesByCriteriaQuery)
export class SearchPreparationRecipesByCriteriaHandler
  implements IQueryHandler<SearchPreparationRecipesByCriteriaQuery>
{
  constructor(private readonly useCase: SearchPreparationRecipesByCriteria) {}

  async execute(
    query: SearchPreparationRecipesByCriteriaQuery
  ): Promise<PaginatedPreparationRecipeListResponse> {
    const result = await this.useCase.run(query.criteria)
    const data = result.data.map(item => PreparationRecipeListItemResponse.fromReadModel(item))
    return new PaginatedPreparationRecipeListResponse(data, result.meta)
  }
}
