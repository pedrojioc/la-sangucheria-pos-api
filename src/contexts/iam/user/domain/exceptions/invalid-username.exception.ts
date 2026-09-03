import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidUsername extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
