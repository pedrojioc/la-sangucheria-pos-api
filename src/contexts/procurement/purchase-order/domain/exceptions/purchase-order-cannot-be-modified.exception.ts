import { DomainException } from '@/shared/domain/exceptions/domain.exception'
import { PurchaseOrderStatus } from '../purchase-order-status'

export class PurchaseOrderCannotBeModified extends DomainException {
  constructor(status: PurchaseOrderStatus) {
    super(
      `Purchase order cannot be modified when status is ${status}. Only DRAFT orders can be edited.`
    )
  }
}
