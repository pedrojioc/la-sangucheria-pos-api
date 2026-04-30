import { Criteria } from '@/shared/domain/criteria/criteria'

/**
 * SearchInventoryLevelsByCriteriaQuery - Query Object (POJO)
 *
 * Query para buscar niveles de inventario con el patrón Criteria.
 */
export class SearchInventoryLevelsByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}
