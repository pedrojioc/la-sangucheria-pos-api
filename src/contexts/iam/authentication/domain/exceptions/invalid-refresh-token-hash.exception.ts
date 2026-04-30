import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidRefreshTokenHash extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
