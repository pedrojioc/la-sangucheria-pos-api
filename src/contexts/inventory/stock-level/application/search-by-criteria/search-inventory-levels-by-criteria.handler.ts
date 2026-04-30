import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchInventoryLevelsByCriteriaQuery } from './search-inventory-levels-by-criteria.query'
import { SearchInventoryLevelsByCriteria } from './search-inventory-levels-by-criteria'
import { PaginatedInventoryLevelListResponse } from '../dto/paginated-inventory-level-list.response'
import { InventoryLevelListItemResponse } from '../dto/inventory-level-list-item.response'

/**
 * SearchInventoryLevelsByCriteriaHandler - Query Handler (CQRS Adapter)
 *
 * Ejecuta el use case y transforma Read Models → Response DTOs.
 */
@QueryHandler(SearchInventoryLevelsByCriteriaQuery)
export class SearchInventoryLevelsByCriteriaHandler
  implements IQueryHandler<SearchInventoryLevelsByCriteriaQuery>
{
  constructor(private readonly useCase: SearchInventoryLevelsByCriteria) {}

  async execute(
    query: SearchInventoryLevelsByCriteriaQuery
  ): Promise<PaginatedInventoryLevelListResponse> {
    const result = await this.useCase.run(query.criteria)

    const data = result.paginated.data.map(item =>
      InventoryLevelListItemResponse.fromReadModel(item)
    )

    return new PaginatedInventoryLevelListResponse(data, result.paginated.meta, result.stats)
  }
}
