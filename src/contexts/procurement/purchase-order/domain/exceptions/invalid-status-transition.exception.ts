import { DomainException } from '@/shared/domain/exceptions/domain.exception'
import { PurchaseOrderStatus } from '../purchase-order-status'

export class InvalidStatusTransition extends DomainException {
  constructor(from: PurchaseOrderStatus, to: PurchaseOrderStatus) {
    super(`Cannot transition purchase order from ${from} to ${to}. Invalid status transition.`)
  }
}
