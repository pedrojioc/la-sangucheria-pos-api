import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetInventoryLevelStatisticsQuery } from './get-inventory-level-statistics.query'
import { GetInventoryLevelStatistics } from './get-inventory-level-statistics'
import { InventoryLevelStatistics } from '../dto/inventory-level-statistics'

@QueryHandler(GetInventoryLevelStatisticsQuery)
export class GetInventoryLevelStatisticsHandler
  implements IQueryHandler<GetInventoryLevelStatisticsQuery>
{
  constructor(private readonly useCase: GetInventoryLevelStatistics) {}

  async execute(): Promise<InventoryLevelStatistics> {
    return this.useCase.run()
  }
}
