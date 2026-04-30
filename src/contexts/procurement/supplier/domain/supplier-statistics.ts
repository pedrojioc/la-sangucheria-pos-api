/**
 * SupplierStatistics - Read Model
 *
 * Represents aggregated statistics across all suppliers.
 * This is a pure data structure without business logic.
 */
export interface SupplierStatistics {
  totalSuppliers: number
  activeSuppliers: number
  averageRating: number | null
  totalOrders: number
}
