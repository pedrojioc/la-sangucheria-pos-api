import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { OptionGroupListItemResponse } from '../../presentation/http/dto/option-group-list-item.response'

export class PaginatedOptionGroupListResponse {
  constructor(
    public readonly data: OptionGroupListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}
