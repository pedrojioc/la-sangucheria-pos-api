import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchCustomersByCriteriaQuery } from './search-customers-by-criteria.query'
import { SearchCustomersByCriteria } from './search-customers-by-criteria'
import { PaginatedCustomerListResponse } from '../dto/paginated-customer-list.response'

@QueryHandler(SearchCustomersByCriteriaQuery)
export class SearchCustomersByCriteriaHandler implements IQueryHandler<SearchCustomersByCriteriaQuery> {
  constructor(private readonly searchCustomersByCriteria: SearchCustomersByCriteria) {}

  async execute(query: SearchCustomersByCriteriaQuery): Promise<PaginatedCustomerListResponse> {
    return this.searchCustomersByCriteria.run(query.criteria)
  }
}
