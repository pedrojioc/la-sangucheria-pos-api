import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchSuppliersByCriteriaQuery } from './search-suppliers-by-criteria.query'
import { SearchSuppliersByCriteria } from './search-suppliers-by-criteria'
import { PaginatedSupplierListResponse } from '../dto/paginated-supplier-list.response'
import { SupplierListItemResponse } from '../../presentation/http/dto/supplier-list-item.response'

@QueryHandler(SearchSuppliersByCriteriaQuery)
export class SearchSuppliersByCriteriaHandler
  implements IQueryHandler<SearchSuppliersByCriteriaQuery>
{
  constructor(private readonly searchSuppliers: SearchSuppliersByCriteria) {}

  async execute(query: SearchSuppliersByCriteriaQuery): Promise<PaginatedSupplierListResponse> {
    const result = await this.searchSuppliers.run(query.criteria)
    const data = result.data.map(item => SupplierListItemResponse.fromReadModel(item))
    return new PaginatedSupplierListResponse(data, result.meta)
  }
}
