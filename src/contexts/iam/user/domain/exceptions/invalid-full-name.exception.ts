import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidFullName extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
