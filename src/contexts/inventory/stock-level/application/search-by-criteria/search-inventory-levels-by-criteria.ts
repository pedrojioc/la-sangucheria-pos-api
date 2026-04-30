import { Criteria } from '@/shared/domain/criteria/criteria'
import { InventoryLevelQueryService } from '../services/inventory-level-query.service'
import { InventoryLevelSearchResult } from '../dto/inventory-level-search-result'

/**
 * SearchInventoryLevelsByCriteria - Use Case (Query)
 *
 * Busca niveles de inventario con filtrado, ordenamiento y paginación.
 * Soporta búsqueda por nombre de ingrediente, ordenar por stock, etc.
 *
 * Usa InventoryLevelQueryService (no el Repository) porque:
 * - Necesita datos de otras tablas (ingredientName, unitName, categoryName)
 * - Devuelve Read Models optimizados para listados, no agregados
 * - Sigue el patrón CQRS: queries usan QueryService, commands usan Repository
 */
export class SearchInventoryLevelsByCriteria {
  constructor(private readonly queryService: InventoryLevelQueryService) {}

  async run(criteria: Criteria): Promise<InventoryLevelSearchResult> {
    return await this.queryService.search(criteria)
  }
}
