import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { OptionGroupListItem } from '../dto/option-group-list-item'

export abstract class OptionGroupQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<OptionGroupListItem>>
}
