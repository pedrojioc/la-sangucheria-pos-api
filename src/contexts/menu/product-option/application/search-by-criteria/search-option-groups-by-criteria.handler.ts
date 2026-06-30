import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchOptionGroupsByCriteriaQuery } from './search-option-groups-by-criteria.query'
import { SearchOptionGroupsByCriteria } from './search-option-groups-by-criteria'
import { PaginatedOptionGroupListResponse } from '../dto/paginated-option-group-list.response'
import { OptionGroupListItemResponse } from '../../presentation/http/dto/option-group-list-item.response'

@QueryHandler(SearchOptionGroupsByCriteriaQuery)
export class SearchOptionGroupsByCriteriaHandler
  implements IQueryHandler<SearchOptionGroupsByCriteriaQuery>
{
  constructor(private readonly useCase: SearchOptionGroupsByCriteria) {}

  async execute(
    query: SearchOptionGroupsByCriteriaQuery
  ): Promise<PaginatedOptionGroupListResponse> {
    const result = await this.useCase.run(query.criteria)
    return new PaginatedOptionGroupListResponse(
      result.data.map(item => OptionGroupListItemResponse.fromReadModel(item)),
      result.meta
    )
  }
}
