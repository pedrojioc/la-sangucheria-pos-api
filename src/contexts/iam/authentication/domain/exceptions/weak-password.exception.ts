import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class WeakPassword extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
