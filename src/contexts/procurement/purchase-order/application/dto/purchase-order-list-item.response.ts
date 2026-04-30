import { PurchaseOrderListItem } from './purchase-order-list-item'

export class PurchaseOrderListItemResponse {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly supplierId: string,
    public readonly supplierName: string,
    public readonly status: string,
    public readonly itemCount: number,
    public readonly requestedBy: string,
    public readonly approvedBy: string | null,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly requestedDate: Date,
    public readonly expectedDeliveryDate: Date | null,
    public readonly approvedDate: Date | null,
    public readonly sentDate: Date | null,
    public readonly receivedDate: Date | null,
    public readonly notes: string | null
  ) {}

  static fromReadModel(item: PurchaseOrderListItem): PurchaseOrderListItemResponse {
    return new PurchaseOrderListItemResponse(
      item.id,
      item.orderNumber,
      item.supplierId,
      item.supplierName,
      item.status,
      item.itemCount,
      item.requestedBy,
      item.approvedBy,
      item.totalAmount,
      item.currency,
      item.requestedDate,
      item.expectedDeliveryDate,
      item.approvedDate,
      item.sentDate,
      item.receivedDate,
      item.notes
    )
  }
}
