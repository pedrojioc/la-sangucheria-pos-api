import { PurchaseOrderStatus } from '../../domain/purchase-order-status'
import { PurchaseMethod } from '../../domain/purchase-method'

/**
 * PurchaseOrderItemReadModel - Read Model for Order Items
 *
 * Incluye datos desnormalizados del ingrediente y unidades
 * para evitar lookups adicionales en el frontend.
 */
export interface PurchaseOrderItemReadModel {
  id: string

  // Ingredient data (denormalized)
  ingredientId: string
  ingredientName: string

  // Quantities with unit info
  quantityRequested: number
  quantityRequestedUnitId: string
  quantityRequestedUnitName: string
  quantityRequestedUnitSymbol: string

  quantityReceived: number | null
  quantityReceivedUnitId: string | null
  quantityReceivedUnitName: string | null
  quantityReceivedUnitSymbol: string | null

  // Financial
  unitCost: number
  totalCost: number
  currency: string

  notes: string | null

  // Cancellation
  isCancelled: boolean
  cancellationReason: string | null
}

/**
 * PurchaseOrderDetailReadModel - Read Model for Detail View
 *
 * Este es un READ MODEL completo para la vista de detalle.
 * Incluye:
 * - Datos del supplier desnormalizados
 * - Items con datos de ingredientes y unidades
 *
 * Usado por:
 * - PurchaseOrderQueryService.findDetail()
 * - Vista de detalle de orden de compra en el frontend
 */
export interface PurchaseOrderDetailReadModel {
  id: string
  orderNumber: string

  // Supplier data (denormalized)
  supplier: {
    id: string
    name: string
    contactName: string | null
    email: string | null
    phone: string | null
  }

  status: PurchaseOrderStatus

  // Items with denormalized data
  items: PurchaseOrderItemReadModel[]
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
