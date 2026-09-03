import { InvalidValueObjectException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidEmail extends InvalidValueObjectException {
  constructor(message: string) {
    super(message)
  }
}
