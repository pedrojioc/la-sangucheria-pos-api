import { PurchaseOrder } from '../purchase-order'
import { PurchaseOrderId } from '../purchase-order-id'
import { PurchaseOrderStatus } from '../purchase-order-status'

/**
 * PurchaseOrderRepository - Repository Interface
 *
 * Contrato para la persistencia de Purchase Orders.
 * La implementación real estará en la capa de infraestructura.
 */
export abstract class PurchaseOrderRepository {
  /**
   * Guarda una orden de compra (create o update)
   */
  abstract save(purchaseOrder: PurchaseOrder): Promise<void>

  /**
   * Busca una orden por su ID
   */
  abstract findById(id: PurchaseOrderId): Promise<PurchaseOrder | null>

  /**
   * Busca una orden por su número
   */
  abstract findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>

  /**
   * Busca todas las órdenes de un proveedor
   */
  abstract findBySupplierId(supplierId: string): Promise<PurchaseOrder[]>

  /**
   * Busca órdenes por estado
   */
  abstract findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]>

  /**
   * Busca todas las órdenes (con paginación futura)
   */
  abstract findAll(): Promise<PurchaseOrder[]>

  /**
   * Obtiene el siguiente número de secuencia para generar orderNumber
   * Útil para: PurchaseOrderNumber.generate(sequence)
   */
  abstract getNextSequenceNumber(): Promise<number>
}
