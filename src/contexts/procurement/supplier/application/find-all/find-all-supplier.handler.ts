import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindAllSuppliersQuery } from './find-all-supplier.query'
import { FindAllSuppliers } from './find-all-supplier'
import { SupplierListResponse } from '../dto/supplier-list.response'

@QueryHandler(FindAllSuppliersQuery)
export class FindAllSuppliersHandler implements IQueryHandler<FindAllSuppliersQuery> {
  constructor(private readonly findAllSuppliers: FindAllSuppliers) {}

  async execute(): Promise<SupplierListResponse> {
    const suppliers = await this.findAllSuppliers.run()
    return SupplierListResponse.fromDomain(suppliers)
  }
}
