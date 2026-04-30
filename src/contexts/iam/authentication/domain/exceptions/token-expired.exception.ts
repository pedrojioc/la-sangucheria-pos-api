import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class TokenExpired extends DomainException {
  constructor() {
    super('Token has expired')
  }
}
