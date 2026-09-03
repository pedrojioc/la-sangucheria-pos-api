import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { SupplierListItemResponse } from './supplier-list-item.response'

export class PaginatedSupplierListResponse {
  constructor(
    public readonly data: SupplierListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
