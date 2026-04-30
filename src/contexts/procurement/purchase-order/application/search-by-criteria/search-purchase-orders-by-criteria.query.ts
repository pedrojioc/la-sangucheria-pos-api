import { Criteria } from '@/shared/domain/criteria/criteria'

/**
 * SearchPurchaseOrdersByCriteriaQuery - Query Object (POJO)
 *
 * Query para buscar órdenes de compra con el patrón Criteria.
 */
export class SearchPurchaseOrdersByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}
