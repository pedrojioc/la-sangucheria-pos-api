import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class PurchaseOrderHasNoItems extends InvalidValueObjectException {
  constructor() {
    super('Purchase order must have at least one item to be submitted for approval')
  }
}
