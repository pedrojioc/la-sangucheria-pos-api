import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidRefreshTokenHash extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
