import { Criteria } from '@shared/domain/criteria/criteria'
import { PaginatedResult } from '@shared/domain/criteria/paginated-result'
import { OrderListItem } from '../dto/order-list-item'

export abstract class OrderQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<OrderListItem>>
}
