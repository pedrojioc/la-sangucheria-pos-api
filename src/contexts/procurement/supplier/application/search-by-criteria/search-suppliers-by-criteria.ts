import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Supplier } from '../../domain/supplier'
import { SupplierRepository } from '../../domain/repositories/supplier.repository'

export class SearchSuppliersByCriteria {
  constructor(private readonly repository: SupplierRepository) {}

  async run(criteria: Criteria): Promise<PaginatedResult<Supplier>> {
    return this.repository.matching(criteria)
  }
}
