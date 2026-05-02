import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { SupplierListItem } from '../dto/supplier-list-item'

export abstract class SupplierQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<SupplierListItem>>
}
