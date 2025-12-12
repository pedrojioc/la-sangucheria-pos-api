import { Supplier } from '../../domain/supplier'
import { SupplierResponse } from './supplier.response'

export class SupplierListResponse {
  constructor(public readonly suppliers: SupplierResponse[]) {}

  static fromDomain(suppliers: Supplier[]): SupplierListResponse {
    return new SupplierListResponse(suppliers.map(SupplierResponse.fromDomain))
  }
}
