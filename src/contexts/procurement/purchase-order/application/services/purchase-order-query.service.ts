import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PurchaseOrderListItem } from '../dto/purchase-order-list-item'
import { PurchaseOrderDetailReadModel } from '../dto/purchase-order-detail-read-model'

/**
 * PurchaseOrderQueryService - Abstract Query Service
 *
 * Servicio de consultas para operaciones de LECTURA de órdenes de compra.
 * Vive en la capa de aplicación porque trabaja con Read Models (DTOs),
 * no con agregados de dominio.
 *
 * Esta abstracción permite:
 * - Separar claramente lectura (queries) de escritura (commands)
 * - Optimizar queries con JOINs sin contaminar el dominio
 * - Mantener el agregado PurchaseOrder puro (solo supplierId, sin supplierName)
 * - Cumplir con CQRS de forma pragmática
 *
 * La implementación (TypeOrmPurchaseOrderQueryService) vive en infraestructura
 * y puede hacer JOINs directos para obtener supplierName, ingredientName, etc.
 */
export abstract class PurchaseOrderQueryService {
  /**
   * Busca órdenes con filtrado, ordenamiento y paginación
   * Devuelve un read model optimizado para listados (sin items)
   */
  abstract search(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>>

  /**
   * Obtiene el detalle completo de una orden incluyendo items
   * Devuelve un read model con datos enriquecidos (supplierName, ingredientNames, etc.)
   */
  abstract findDetail(id: string): Promise<PurchaseOrderDetailReadModel | null>
}
