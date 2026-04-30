import { DomainException } from '@/shared/domain/exceptions/domain.exception'

/**
 * Exception thrown when trying to cancel an item that has already received
 * a partial or full quantity.
 */
export class PurchaseOrderItemCannotBeCancelled extends DomainException {
  constructor(itemId: string) {
    super(
      `Item ${itemId} cannot be cancelled because it has already received a quantity. Only items with no received quantity can be cancelled.`
    )
  }
}
