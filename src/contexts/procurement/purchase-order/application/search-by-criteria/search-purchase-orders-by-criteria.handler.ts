import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchPurchaseOrdersByCriteriaQuery } from './search-purchase-orders-by-criteria.query'
import { SearchPurchaseOrdersByCriteria } from './search-purchase-orders-by-criteria'
import { PaginatedPurchaseOrderListResponse } from '../dto/paginated-purchase-order-list.response'
import { PurchaseOrderListItemResponse } from '../dto/purchase-order-list-item.response'

/**
 * SearchPurchaseOrdersByCriteriaHandler - Query Handler (CQRS Adapter)
 *
 * Ejecuta el use case y transforma Read Models → Response DTOs.
 *
 * El use case ya devuelve PurchaseOrderListItem (read model) con supplierName
 * incluido, así que solo necesitamos mapear al DTO de respuesta.
 */
@QueryHandler(SearchPurchaseOrdersByCriteriaQuery)
export class SearchPurchaseOrdersByCriteriaHandler
  implements IQueryHandler<SearchPurchaseOrdersByCriteriaQuery>
{
  constructor(private readonly useCase: SearchPurchaseOrdersByCriteria) {}

  async execute(
    query: SearchPurchaseOrdersByCriteriaQuery
  ): Promise<PaginatedPurchaseOrderListResponse> {
    const result = await this.useCase.run(query.criteria)

    // Transform Read Models → Response DTOs
    const data = result.data.map(item => PurchaseOrderListItemResponse.fromReadModel(item))

    return new PaginatedPurchaseOrderListResponse(data, result.meta)
  }
}
