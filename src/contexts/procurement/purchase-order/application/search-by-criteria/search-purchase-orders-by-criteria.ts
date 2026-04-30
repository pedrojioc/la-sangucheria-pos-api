import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PurchaseOrderQueryService } from '../services/purchase-order-query.service'
import { PurchaseOrderListItem } from '../dto/purchase-order-list-item'

/**
 * SearchPurchaseOrdersByCriteria - Use Case (Query)
 *
 * Busca órdenes de compra con filtrado, ordenamiento y paginación.
 * Soporta búsqueda por nombre de proveedor, número de orden, estado, fechas, etc.
 *
 * Este use case usa PurchaseOrderQueryService (no el Repository) porque:
 * - Necesita datos de otras tablas (supplierName)
 * - Devuelve Read Models optimizados para listados, no agregados
 * - Sigue el patrón CQRS: queries usan QueryService, commands usan Repository
 */
export class SearchPurchaseOrdersByCriteria {
  constructor(private readonly queryService: PurchaseOrderQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>> {
    return await this.queryService.search(criteria)
  }
}
