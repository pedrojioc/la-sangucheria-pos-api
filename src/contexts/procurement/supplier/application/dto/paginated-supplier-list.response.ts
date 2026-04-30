import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Supplier } from '../../domain/supplier'
import { SupplierResponse } from './supplier.response'

export class PaginatedSupplierListResponse {
  constructor(
    public readonly data: SupplierResponse[],
    public readonly meta: {
      total: number
      page: number
      pageSize: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  ) {}

  static fromDomain(result: PaginatedResult<Supplier>): PaginatedSupplierListResponse {
    return new PaginatedSupplierListResponse(
      result.data.map(SupplierResponse.fromDomain),
      result.meta
    )
  }
}
