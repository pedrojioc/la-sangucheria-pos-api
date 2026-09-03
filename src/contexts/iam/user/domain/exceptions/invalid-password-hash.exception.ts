import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidPasswordHash extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
