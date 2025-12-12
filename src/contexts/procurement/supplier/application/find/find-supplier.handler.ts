import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindSupplierQuery } from './find-supplier.query'
import { FindSupplier } from './find-supplier'
import { SupplierResponse } from '../dto/supplier.response'

@QueryHandler(FindSupplierQuery)
export class FindSupplierHandler implements IQueryHandler<FindSupplierQuery> {
  constructor(private readonly findSupplier: FindSupplier) {}

  async execute(query: FindSupplierQuery): Promise<SupplierResponse> {
    const supplier = await this.findSupplier.run(query.id)
    return SupplierResponse.fromDomain(supplier)
  }
}
