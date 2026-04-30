import { InventoryLevelStatistics } from '../dto/inventory-level-statistics'

export abstract class InventoryLevelStatisticsQueryService {
  abstract getStatistics(): Promise<InventoryLevelStatistics>
}
