import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class CannotRemoveDefaultAddress extends DomainException {
  constructor(addressId: string) {
    super(
      `Cannot remove address ${addressId} because it is the default address. Set a different default first.`
    )
  }
}
