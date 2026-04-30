import { PurchaseOrder } from '../purchase-order'
import { PurchaseOrderId } from '../purchase-order-id'
import { PurchaseOrderStatus } from '../purchase-order-status'

/**
 * PurchaseOrderRepository - Repository Interface (WRITE Operations)
 *
 * Contrato para la persistencia de Purchase Orders.
 * Este repositorio se enfoca en operaciones de ESCRITURA y búsquedas
 * necesarias para comandos (por ID, por orderNumber).
 *
 * Para operaciones de LECTURA complejas (listados con paginación, filtros,
 * búsqueda por supplierName), usar PurchaseOrderQueryService en la capa
 * de aplicación.
 *
 * Esta separación permite:
 * - Mantener el agregado PurchaseOrder puro (solo supplierId, sin supplierName)
 * - Optimizar queries de lectura con JOINs sin contaminar el dominio
 * - Cumplir con CQRS de forma pragmática
 */
export abstract class PurchaseOrderRepository {
  /**
   * Guarda una orden de compra (create o update)
   */
  abstract save(purchaseOrder: PurchaseOrder): Promise<void>

  /**
   * Busca una orden por su ID (para comandos que necesitan el agregado)
   */
  abstract findById(id: PurchaseOrderId): Promise<PurchaseOrder | null>

  /**
   * Busca una orden por su número (para validación de unicidad)
   */
  abstract findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>

  /**
   * Busca órdenes por estado (para procesos batch/background)
   */
  abstract findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]>

  /**
   * Obtiene el siguiente número de secuencia para generar orderNumber
   */
  abstract getNextSequenceNumber(): Promise<number>
}
