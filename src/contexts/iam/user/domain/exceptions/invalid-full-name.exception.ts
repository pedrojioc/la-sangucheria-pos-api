import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidFullName extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
