import { DomainException } from '@/shared/domain/exceptions/domain.exception'

/**
 * Exception thrown when trying to close a purchase order
 * that has unprocessed items (not received and not cancelled).
 */
export class PurchaseOrderCannotBeClosed extends DomainException {
  constructor(pendingItemsCount: number) {
    super(
      `Purchase order cannot be closed. There are ${pendingItemsCount} item(s) that have not been received or cancelled.`
    )
  }
}
