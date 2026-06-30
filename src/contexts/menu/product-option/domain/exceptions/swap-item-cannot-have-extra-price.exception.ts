import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class SwapItemCannotHaveExtraPrice extends DomainException {
  constructor() {
    super('SWAP option group items cannot have an extra price')
  }
}
