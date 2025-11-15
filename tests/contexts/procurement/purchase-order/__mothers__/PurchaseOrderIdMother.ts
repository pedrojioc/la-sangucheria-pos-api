import { PurchaseOrderId } from '@/contexts/procurement/purchase-order/domain/purchase-order-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class PurchaseOrderIdMother {
  static create(value?: string): PurchaseOrderId {
    return new PurchaseOrderId(value ?? UuidMother.random())
  }

  static random(): PurchaseOrderId {
    return this.create()
  }
}
