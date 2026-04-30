import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetSupplierStatisticsQuery } from './get-supplier-statistics.query'
import { GetSupplierStatistics } from './get-supplier-statistics'
import { SupplierStatisticsResponse } from '../dto/supplier-statistics.response'

@QueryHandler(GetSupplierStatisticsQuery)
export class GetSupplierStatisticsHandler implements IQueryHandler<GetSupplierStatisticsQuery> {
  constructor(private readonly useCase: GetSupplierStatistics) {}

  async execute(query: GetSupplierStatisticsQuery): Promise<SupplierStatisticsResponse> {
    const statistics = await this.useCase.run()
    return SupplierStatisticsResponse.fromDomain(statistics)
  }
}
