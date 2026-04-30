import { PurchaseOrderStatus } from '../../domain/purchase-order-status'
import { PurchaseMethod } from '../../domain/purchase-method'

/**
 * PurchaseOrderListItem - Read Model for List Views
 *
 * Este es un READ MODEL, NO un agregado de dominio.
 * Contiene datos desnormalizados (supplierName) optimizados para lectura.
 *
 * Usado por:
 * - PurchaseOrderQueryService.search()
 * - Listados de órdenes de compra en el frontend
 *
 * NO incluye items para optimizar performance en listados.
 * Para ver items, usar PurchaseOrderDetailReadModel.
 */
export interface PurchaseOrderListItem {
  id: string
  orderNumber: string

  // Supplier data (denormalized for read performance)
  supplierId: string
  supplierName: string

  status: PurchaseOrderStatus
  itemCount: number

  // Workflow tracking
  requestedBy: string
  approvedBy: string | null
  rejectedBy: string | null
  sentBy: string | null
  receivedBy: string | null
  closedBy: string | null

  // Purchase method
  purchaseMethod: PurchaseMethod | null
  purchaseMethodDetails: string | null

  // Financial
  totalAmount: number
  currency: string

  // Dates
  requestedDate: Date
  expectedDeliveryDate: Date | null
  approvedDate: Date | null
  sentDate: Date | null
  receivedDate: Date | null
  closedDate: Date | null

  notes: string | null
}
