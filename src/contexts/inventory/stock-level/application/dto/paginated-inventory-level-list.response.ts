import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { InventoryLevelListItemResponse } from './inventory-level-list-item.response'
import { InventoryLevelStats } from './inventory-level-stats'

/**
 * PaginatedInventoryLevelListResponse - Paginated Response Wrapper
 *
 * Envuelve la lista de niveles de inventario con metadatos de paginación
 * y conteos de estado (lowStock, criticalStock, outOfStock) para badges de filtros.
 */
export class PaginatedInventoryLevelListResponse {
  constructor(
    public readonly data: InventoryLevelListItemResponse[],
    public readonly meta: PaginationMeta,
    public readonly stats: InventoryLevelStats
  ) {}
}
