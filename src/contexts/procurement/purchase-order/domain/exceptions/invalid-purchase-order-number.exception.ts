import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidPurchaseOrderNumber extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
