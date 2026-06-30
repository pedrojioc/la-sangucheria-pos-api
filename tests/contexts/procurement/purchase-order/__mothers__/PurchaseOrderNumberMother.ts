import { PurchaseOrderNumber } from '@/contexts/procurement/purchase-order/domain/purchase-order-number'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class PurchaseOrderNumberMother {
  static create(value?: string): PurchaseOrderNumber {
    return new PurchaseOrderNumber(value ?? this.random())
  }

  static random(): string {
    const year = new Date().getFullYear()
    const sequence = NumberMother.random({ min: 1, max: 9999 }).toString().padStart(4, '0')
    return `PO-${year}-${sequence}`
  }
}
