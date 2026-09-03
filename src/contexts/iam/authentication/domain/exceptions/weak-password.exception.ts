import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class WeakPassword extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
