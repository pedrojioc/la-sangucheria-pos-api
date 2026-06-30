import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchIngredientCategoriesByCriteriaQuery } from './search-ingredient-categories-by-criteria.query'
import { SearchIngredientCategoriesByCriteria } from './search-ingredient-categories-by-criteria'
import { PaginatedIngredientCategoryListResponse } from '../dto/paginated-ingredient-category-list.response'
import { IngredientCategoryListItemResponse } from '../dto/ingredient-category-list-item.response'

@QueryHandler(SearchIngredientCategoriesByCriteriaQuery)
export class SearchIngredientCategoriesByCriteriaHandler
  implements IQueryHandler<SearchIngredientCategoriesByCriteriaQuery>
{
  constructor(private readonly useCase: SearchIngredientCategoriesByCriteria) {}

  async execute(
    query: SearchIngredientCategoriesByCriteriaQuery
  ): Promise<PaginatedIngredientCategoryListResponse> {
    const result = await this.useCase.run(query.criteria)
    const data = result.data.map(item => IngredientCategoryListItemResponse.fromReadModel(item))
    return new PaginatedIngredientCategoryListResponse(data, result.meta)
  }
}
