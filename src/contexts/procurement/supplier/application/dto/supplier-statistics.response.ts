import { SupplierStatistics } from '../../domain/supplier-statistics'

/**
 * SupplierStatisticsResponse - DTO
 *
 * Response DTO for supplier statistics endpoint.
 */
export class SupplierStatisticsResponse {
  constructor(
    public readonly totalSuppliers: number,
    public readonly activeSuppliers: number,
    public readonly averageRating: number | null,
    public readonly totalOrders: number
  ) {}

  static fromDomain(statistics: SupplierStatistics): SupplierStatisticsResponse {
    return new SupplierStatisticsResponse(
      statistics.totalSuppliers,
      statistics.activeSuppliers,
      statistics.averageRating,
      statistics.totalOrders
    )
  }
}
