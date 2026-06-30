import { PurchaseOrderDetailReadModel } from './purchase-order-detail-read-model'
import { PurchaseOrderStatus } from '../../domain/purchase-order-status'

export interface PurchaseOrderItemResponse {
  id: string
  ingredientId: string
  ingredientName: string
  quantityRequested: number
  quantityRequestedUnitId: string
  quantityRequestedUnitName: string
  quantityRequestedUnitSymbol: string
  unitCost: number
  totalCost: number
  quantityReceived: number | null
  quantityReceivedUnitId: string | null
  quantityReceivedUnitName: string | null
  quantityReceivedUnitSymbol: string | null
  notes: string | null
  isCancelled: boolean
  cancellationReason: string | null
}

/**
 * PurchaseOrderResponse - Response DTO for Detail View
 *
 * Este DTO se usa para mostrar el detalle completo de una orden.
 * Incluye datos de supplier e items con información enriquecida.
 *
 * Se construye desde PurchaseOrderDetailReadModel (del QueryService),
 * NO desde el agregado de dominio.
 */
export class PurchaseOrderResponse {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly supplierId: string,
    public readonly supplier: {
      id: string
      name: string
      contactName: string | null
      email: string | null
      phone: string | null
    },
    public readonly status: PurchaseOrderStatus,
    public readonly items: PurchaseOrderItemResponse[],
    public readonly itemCount: number,
    public readonly requestedBy: { id: string; name: string },
    public readonly submittedBy: { id: string; name: string } | null,
    public readonly approvedBy: { id: string; name: string } | null,
    public readonly rejectedBy: { id: string; name: string } | null,
    public readonly sentBy: { id: string; name: string } | null,
    public readonly cancelledBy: { id: string; name: string } | null,
    public readonly receivedBy: { id: string; name: string } | null,
    public readonly closedBy: { id: string; name: string } | null,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly requestedDate: Date,
    public readonly expectedDeliveryDate: Date | null,
    public readonly submittedDate: Date | null,
    public readonly approvedDate: Date | null,
    public readonly sentDate: Date | null,
    public readonly receivedDate: Date | null,
    public readonly rejectedDate: Date | null,
    public readonly cancelledDate: Date | null,
    public readonly closedDate: Date | null,
    public readonly notes: string | null
  ) {}

  /**
   * Creates a response DTO from a Read Model (from QueryService)
   * This is the preferred method as it has all enriched data
   */
  static fromReadModel(readModel: PurchaseOrderDetailReadModel): PurchaseOrderResponse {
    return new PurchaseOrderResponse(
      readModel.id,
      readModel.orderNumber,
      readModel.supplier.id,
      readModel.supplier,
      readModel.status,
      readModel.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        quantityRequested: item.quantityRequested,
        quantityRequestedUnitId: item.quantityRequestedUnitId,
        quantityRequestedUnitName: item.quantityRequestedUnitName,
        quantityRequestedUnitSymbol: item.quantityRequestedUnitSymbol,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        quantityReceived: item.quantityReceived,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        quantityReceivedUnitName: item.quantityReceivedUnitName,
        quantityReceivedUnitSymbol: item.quantityReceivedUnitSymbol,
        notes: item.notes,
        isCancelled: item.isCancelled,
        cancellationReason: item.cancellationReason
      })),
      readModel.itemCount,
      readModel.requestedBy,
      readModel.submittedBy,
      readModel.approvedBy,
      readModel.rejectedBy,
      readModel.sentBy,
      readModel.cancelledBy,
      readModel.receivedBy,
      readModel.closedBy,
      readModel.totalAmount,
      readModel.currency,
      readModel.requestedDate,
      readModel.expectedDeliveryDate,
      readModel.submittedDate,
      readModel.approvedDate,
      readModel.sentDate,
      readModel.receivedDate,
      readModel.rejectedDate,
      readModel.cancelledDate,
      readModel.closedDate,
      readModel.notes
    )
  }
}
