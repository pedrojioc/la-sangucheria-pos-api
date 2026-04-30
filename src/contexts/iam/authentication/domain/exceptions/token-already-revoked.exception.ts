import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class TokenAlreadyRevoked extends DomainException {
  constructor() {
    super('Token has already been revoked')
  }
}
