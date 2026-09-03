import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidPurchaseOrderNumber extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
