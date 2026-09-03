import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

/**
 * Exception thrown when a purchase order with the given id does not exist.
 */
export class PurchaseOrderNotFound extends NotFoundException {
  constructor(purchaseOrderId: string) {
    super(`Purchase order ${purchaseOrderId} not found`)
  }
}
