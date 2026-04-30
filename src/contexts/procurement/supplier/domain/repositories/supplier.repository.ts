import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Supplier } from '../supplier'
import { SupplierId } from '../supplier-id'
import { SupplierStatistics } from '../supplier-statistics'

export abstract class SupplierRepository {
  abstract save(supplier: Supplier): Promise<void>

  abstract search(id: SupplierId): Promise<Supplier | null>

  abstract searchAll(): Promise<Supplier[]>

  abstract matching(criteria: Criteria): Promise<PaginatedResult<Supplier>>

  abstract getStatistics(): Promise<SupplierStatistics>
}
