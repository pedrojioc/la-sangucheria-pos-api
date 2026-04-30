import { InventoryLevelStatisticsQueryService } from '../services/inventory-level-statistics-query.service'
import { InventoryLevelStatistics } from '../dto/inventory-level-statistics'

export class GetInventoryLevelStatistics {
  constructor(private readonly queryService: InventoryLevelStatisticsQueryService) {}

  async run(): Promise<InventoryLevelStatistics> {
    return this.queryService.getStatistics()
  }
}
