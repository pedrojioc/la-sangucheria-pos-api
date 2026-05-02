import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { SupplierListItemResponse } from '../../presentation/http/dto/supplier-list-item.response'

export class PaginatedSupplierListResponse {
  constructor(
    public readonly data: SupplierListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
