import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { SupplierQueryService } from '../services/supplier-query.service'
import { SupplierListItem } from '../dto/supplier-list-item'

export class SearchSuppliersByCriteria {
  constructor(private readonly queryService: SupplierQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<SupplierListItem>> {
    return this.queryService.search(criteria)
  }
}
