import {
  PurchaseOrder,
  PurchaseOrderPrimitives
} from '@/contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderNumberMother } from './PurchaseOrderNumberMother'
import { PurchaseOrderItemMother } from './PurchaseOrderItemMother'

export class PurchaseOrderMother {
  static create(params: Partial<PurchaseOrderPrimitives> = {}): PurchaseOrder {
    // Por defecto, crear con 2 items si no se especifica
    const defaultItems = params.items ?? [
      PurchaseOrderItemMother.random().toPrimitives(),
      PurchaseOrderItemMother.random().toPrimitives()
    ]

    const totalAmount =
      params.totalAmount ?? defaultItems.reduce((sum, item) => sum + item.totalCost, 0)

    const primitives: PurchaseOrderPrimitives = {
      id: params.id ?? UuidMother.random(),
      orderNumber: params.orderNumber ?? PurchaseOrderNumberMother.random(),
      supplierId: params.supplierId ?? UuidMother.random(),
      status: params.status ?? PurchaseOrderStatus.DRAFT,
      items: defaultItems,
      itemCount: params.itemCount ?? defaultItems.length,
      requestedBy: params.requestedBy ?? UuidMother.random(),
      submittedBy: params.submittedBy ?? null,
      approvedBy: params.approvedBy ?? null,
      rejectedBy: params.rejectedBy ?? null,
      sentBy: params.sentBy ?? null,
      cancelledBy: params.cancelledBy ?? null,
      receivedBy: params.receivedBy ?? null,
      closedBy: params.closedBy ?? null,
      purchaseMethod: params.purchaseMethod ?? null,
      purchaseMethodDetails: params.purchaseMethodDetails ?? null,
      totalAmount: totalAmount,
      currency: params.currency ?? 'PEN',
      requestedDate: params.requestedDate ?? new Date(),
      expectedDeliveryDate: params.expectedDeliveryDate ?? null,
      submittedDate: params.submittedDate ?? null,
      approvedDate: params.approvedDate ?? null,
      sentDate: params.sentDate ?? null,
      receivedDate: params.receivedDate ?? null,
      rejectedDate: params.rejectedDate ?? null,
      cancelledDate: params.cancelledDate ?? null,
      closedDate: params.closedDate ?? null,
      notes: params.notes ?? null
    }

    return PurchaseOrder.fromPrimitives(primitives)
  }

  static random(): PurchaseOrder {
    return this.create()
  }

  static inDraft(): PurchaseOrder {
    return this.create({ status: PurchaseOrderStatus.DRAFT })
  }

  static withoutItems(): PurchaseOrder {
    return this.create({ items: [], totalAmount: 0 })
  }

  static pendingApproval(): PurchaseOrder {
    return this.create({ status: PurchaseOrderStatus.PENDING_APPROVAL })
  }

  static approved(): PurchaseOrder {
    return this.create({
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: UuidMother.random(),
      approvedDate: new Date()
    })
  }

  static partiallyReceived(): PurchaseOrder {
    return this.create({
      status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
      approvedBy: UuidMother.random(),
      approvedDate: new Date(),
      receivedDate: new Date()
    })
  }

  static closed(): PurchaseOrder {
    return this.create({
      status: PurchaseOrderStatus.CLOSED,
      approvedBy: UuidMother.random(),
      approvedDate: new Date(),
      closedBy: UuidMother.random(),
      closedDate: new Date(),
      receivedDate: new Date()
    })
  }
}
