import { PurchaseOrder, PurchaseOrderPrimitives } from '../../domain/purchase-order'
import { PurchaseOrderStatus } from '../../domain/purchase-order-status'

export interface PurchaseOrderItemResponse {
  id: string
  ingredientId: string
  quantityRequested: number
  quantityRequestedUnitId: string
  unitCost: number
  totalCost: number
  quantityReceived: number | null
  quantityReceivedUnitId: string | null
  notes: string | null
}

export class PurchaseOrderResponse {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly supplierId: string,
    public readonly status: PurchaseOrderStatus,
    public readonly items: PurchaseOrderItemResponse[],
    public readonly requestedBy: string,
    public readonly approvedBy: string | null,
    public readonly rejectedBy: string | null,
    public readonly sentBy: string | null,
    public readonly closedBy: string | null,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly requestedDate: Date,
    public readonly expectedDeliveryDate: Date | null,
    public readonly approvedDate: Date | null,
    public readonly sentDate: Date | null,
    public readonly receivedDate: Date | null,
    public readonly closedDate: Date | null,
    public readonly notes: string | null
  ) {}

  static fromDomain(purchaseOrder: PurchaseOrder): PurchaseOrderResponse {
    const primitives = purchaseOrder.toPrimitives()

    return new PurchaseOrderResponse(
      primitives.id,
      primitives.orderNumber,
      primitives.supplierId,
      primitives.status,
      primitives.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityRequested: item.quantityRequested,
        quantityRequestedUnitId: item.quantityRequestedUnitId,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        quantityReceived: item.quantityReceived,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        notes: item.notes
      })),
      primitives.requestedBy,
      primitives.approvedBy,
      primitives.rejectedBy,
      primitives.sentBy,
      primitives.closedBy,
      primitives.totalAmount,
      primitives.currency,
      primitives.requestedDate,
      primitives.expectedDeliveryDate,
      primitives.approvedDate,
      primitives.sentDate,
      primitives.receivedDate,
      primitives.closedDate,
      primitives.notes
    )
  }

  static fromPrimitives(primitives: PurchaseOrderPrimitives): PurchaseOrderResponse {
    return new PurchaseOrderResponse(
      primitives.id,
      primitives.orderNumber,
      primitives.supplierId,
      primitives.status,
      primitives.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityRequested: item.quantityRequested,
        quantityRequestedUnitId: item.quantityRequestedUnitId,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        quantityReceived: item.quantityReceived,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        notes: item.notes
      })),
      primitives.requestedBy,
      primitives.approvedBy,
      primitives.rejectedBy,
      primitives.sentBy,
      primitives.closedBy,
      primitives.totalAmount,
      primitives.currency,
      primitives.requestedDate,
      primitives.expectedDeliveryDate,
      primitives.approvedDate,
      primitives.sentDate,
      primitives.receivedDate,
      primitives.closedDate,
      primitives.notes
    )
  }
}
