import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { CustomerListItem } from '../dto/customer-list-item'

export abstract class CustomerQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<CustomerListItem>>
}
