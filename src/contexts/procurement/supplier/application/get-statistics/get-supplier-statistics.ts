import { SupplierRepository } from '../../domain/repositories/supplier.repository'
import { SupplierStatistics } from '../../domain/supplier-statistics'

/**
 * GetSupplierStatistics - Query Use Case
 *
 * Retrieves aggregated statistics for all suppliers.
 * This is a read-only operation with no side effects.
 */
export class GetSupplierStatistics {
  constructor(private readonly repository: SupplierRepository) {}

  async run(): Promise<SupplierStatistics> {
    return this.repository.getStatistics()
  }
}
