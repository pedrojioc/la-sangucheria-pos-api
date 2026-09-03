import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class SwapItemCannotHaveExtraPrice extends InvalidValueObjectException {
  constructor() {
    super('SWAP option group items cannot have an extra price')
  }
}
