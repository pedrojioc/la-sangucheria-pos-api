import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { OptionGroupListItem } from '../dto/option-group-list-item'
import { OptionGroupQueryService } from '../services/option-group-query.service'

export class SearchOptionGroupsByCriteria {
  constructor(private readonly queryService: OptionGroupQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<OptionGroupListItem>> {
    return this.queryService.search(criteria)
  }
}
