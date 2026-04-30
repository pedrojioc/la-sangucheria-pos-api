import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchSuppliersByCriteriaQuery } from './search-suppliers-by-criteria.query'
import { SearchSuppliersByCriteria } from './search-suppliers-by-criteria'
import { PaginatedSupplierListResponse } from '../dto/paginated-supplier-list.response'

@QueryHandler(SearchSuppliersByCriteriaQuery)
export class SearchSuppliersByCriteriaHandler
  implements IQueryHandler<SearchSuppliersByCriteriaQuery>
{
  constructor(private readonly searchSuppliers: SearchSuppliersByCriteria) {}

  async execute(query: SearchSuppliersByCriteriaQuery): Promise<PaginatedSupplierListResponse> {
    const result = await this.searchSuppliers.run(query.criteria)

    return PaginatedSupplierListResponse.fromDomain(result)
  }
}
