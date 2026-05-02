import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { CustomerQueryService } from '../services/customer-query.service'
import { CustomerListItem } from '../dto/customer-list-item'

export class SearchCustomersByCriteria {
  constructor(private readonly queryService: CustomerQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<CustomerListItem>> {
    return this.queryService.search(criteria)
  }
}
