import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchCustomersByCriteriaQuery } from './search-customers-by-criteria.query'
import { SearchCustomersByCriteria } from './search-customers-by-criteria'
import { PaginatedCustomerListResponse } from '../dto/paginated-customer-list.response'
import { CustomerListItemResponse } from '../dto/customer-list-item.response'

@QueryHandler(SearchCustomersByCriteriaQuery)
export class SearchCustomersByCriteriaHandler
  implements IQueryHandler<SearchCustomersByCriteriaQuery>
{
  constructor(private readonly searchCustomersByCriteria: SearchCustomersByCriteria) {}

  async execute(query: SearchCustomersByCriteriaQuery): Promise<PaginatedCustomerListResponse> {
    const result = await this.searchCustomersByCriteria.run(query.criteria)
    const data = result.data.map(item => CustomerListItemResponse.fromReadModel(item))
    return new PaginatedCustomerListResponse(data, result.meta)
  }
}
