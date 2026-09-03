import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidRefreshTokenJti extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
