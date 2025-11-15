import { PurchaseOrder, PurchaseOrderPrimitives } from '@/contexts/procurement/purchase-order/domain/purchase-order'
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

    const totalAmount = params.totalAmount ?? defaultItems.reduce((sum, item) => sum + item.totalCost, 0)

    const primitives: PurchaseOrderPrimitives = {
      id: params.id ?? UuidMother.random(),
      orderNumber: params.orderNumber ?? PurchaseOrderNumberMother.random(),
      supplierId: params.supplierId ?? UuidMother.random(),
      status: params.status ?? PurchaseOrderStatus.DRAFT,
      items: defaultItems,
      requestedBy: params.requestedBy ?? UuidMother.random(),
      approvedBy: params.approvedBy ?? null,
      rejectedBy: params.rejectedBy ?? null,
      sentBy: params.sentBy ?? null,
      closedBy: params.closedBy ?? null,
      totalAmount: totalAmount,
      currency: params.currency ?? 'PEN',
      requestedDate: params.requestedDate ?? new Date(),
      expectedDeliveryDate: params.expectedDeliveryDate ?? null,
      approvedDate: params.approvedDate ?? null,
      sentDate: params.sentDate ?? null,
      receivedDate: params.receivedDate ?? null,
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

  static sent(): PurchaseOrder {
    return this.create({
      status: PurchaseOrderStatus.SENT,
      approvedBy: UuidMother.random(),
      approvedDate: new Date(),
      sentBy: UuidMother.random(),
      sentDate: new Date()
    })
  }
}
