import { Criteria } from '@shared/domain/criteria/criteria'
import { PaginatedResult } from '@shared/domain/criteria/paginated-result'
import { OrderQueryService } from '../services/order-query.service'
import { OrderListItem } from '../dto/order-list-item'

export class SearchOrdersByCriteria {
  constructor(private readonly queryService: OrderQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<OrderListItem>> {
    return this.queryService.search(criteria)
  }
}
