import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { InventoryLevelListItem } from './inventory-level-list-item'
import { InventoryLevelStats } from './inventory-level-stats'

export interface InventoryLevelSearchResult {
  paginated: PaginatedResult<InventoryLevelListItem>
  stats: InventoryLevelStats
}
